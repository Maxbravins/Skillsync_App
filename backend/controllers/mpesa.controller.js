import Application from "../models/application.model.js";
import Job from "../models/job.model.js";
import Transaction from "../models/transaction.model.js";
import Notification from "../models/notification.model.js";
import Contract from "../models/contract.model.js";
import { initiateSTKPush } from "../services/mpesa.service.js";
import { calculateCommission } from "../services/platformFee.service.js";
import { sendPaymentConfirmationToClient, sendPaymentReceivedEmail 
} from "../services/email.service.js";

// 1. INITIATE PAYMENT (Client pays into escrow)
export const initiatePayment = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // --- Fetch and validate application ---
    const application = await Application.findById(applicationId)
      .populate("job")
      .populate("developer", "username email");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (application.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Only accepted applications can be paid for.",
      });
    }

    if (application.paymentStatus === "escrow" || application.paymentStatus === "released") {
      return res.status(400).json({
        success: false,
        message: "This application has already been paid for.",
      });
    }

    const job = application.job;

    if (job.client.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized.",
      });
    }

    // --- Check for existing pending transaction ---
    const existingTransaction = await Transaction.findOne({
      application: application._id,
      status: { $in: ["pending", "processing"] },
    });

    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message: "A payment is already in progress for this application.",
        transactionId: existingTransaction.transactionId,
      });
    }

    // --- Calculate amounts (store once, reuse later) ---
    const projectAmount = job.budget;
    const commission = calculateCommission(projectAmount);
    const totalAmount = projectAmount + commission;
    const developerAmount = projectAmount - commission;

    // --- Initiate M-Pesa STK Push ---
    let stkResponse;
    try {
      stkResponse = await initiateSTKPush({
        phoneNumber,
        amount: totalAmount,
        accountReference: `SkillSync-${job._id.toString().slice(-6)}`,
        transactionDesc: `Escrow payment for: ${job.title}`,
      });
    } catch (error) {
      return res.status(502).json({
        success: false,
        message: error.message || "M-Pesa could not initiate the payment request.",
      });
    }

    // --- Create transaction record (in escrow) ---
    const transaction = await Transaction.create({
      transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type: "project_payment",
      application: application._id,
      job: job._id,
      client: req.user.id,
      developer: application.developer._id,
      
      // Amounts
      amount: totalAmount,
      projectAmount: projectAmount,
      platformFee: commission,
      developerAmount: developerAmount,
      totalAmount: totalAmount,
      
      // Escrow
      escrowStatus: "held", // ← Money held in escrow
      
      paymentMethod: "mpesa",
      status: "pending",
      
      // M-Pesa details
      mpesa: {
        merchantRequestID: stkResponse.MerchantRequestID,
        checkoutRequestID: stkResponse.CheckoutRequestID,
        phoneNumber,
      },
    });

    // --- Update application ---
    application.transaction = transaction._id;
    application.paymentStatus = "pending";
    await application.save();

    // --- Update job with escrow amount ---
    job.paymentStatus = "escrow";
    job.escrowAmount = projectAmount;
    await job.save();

    res.status(200).json({
      success: true,
      message: "STK Push sent successfully. Funds will be held in escrow.",
      transaction: {
        transactionId: transaction.transactionId,
        checkoutRequestID: transaction.mpesa.checkoutRequestID,
        status: transaction.status,
      },
    });

  } catch (error) {
    console.error("Payment initiation error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Payment initiation failed.",
    });
  }
};

// ============================================
// 2. M-PESA CALLBACK (Verify payment)
// ============================================
export const mpesaCallback = async (req, res) => {
  try {
    // --- IMMEDIATELY acknowledge receipt (before processing) ---
    // M-Pesa expects a 200 OK quickly, or they'll retry
    res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });

    // --- Extract callback data ---
    const callback = req.body?.Body?.stkCallback;
    if (!callback) {
      console.error("Invalid M-Pesa callback:", req.body);
      return;
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;

    // --- Find the transaction ---
    const transaction = await Transaction.findOne({
      "mpesa.checkoutRequestID": CheckoutRequestID,
    });

    if (!transaction) {
      console.error(`Transaction not found for CheckoutRequestID: ${CheckoutRequestID}`);
      return;
    }

    // --- IMPLEMENT IDEMPOTENCY: If already processed, skip ---
    if (transaction.status === "completed" || transaction.status === "failed") {
      console.log(`Transaction ${transaction.transactionId} already processed. Skipping.`);
      return;
    }

    // --- Update transaction with callback data ---
    transaction.mpesa.resultCode = ResultCode;
    transaction.mpesa.resultDesc = ResultDesc;

    // --- Handle SUCCESS ---
    if (ResultCode === 0) {
      const metadata = CallbackMetadata?.Item || [];
      const receipt = metadata.find(item => item.Name === "MpesaReceiptNumber");
      const amount = metadata.find(item => item.Name === "Amount");
      
      transaction.status = "completed";
      transaction.mpesa.mpesaReceiptNumber = receipt?.Value || "";
      transaction.paidAt = new Date();
      
      // CRITICAL: Store exact amount paid (for verification)
      const paidAmount = amount?.Value || transaction.amount;
      if (paidAmount !== transaction.amount) {
        console.warn(`Amount mismatch: Expected ${transaction.amount}, got ${paidAmount}`);
        // Still process but flag for admin review
        transaction.metadata = { amountMismatch: true, expected: transaction.amount, received: paidAmount };
      }
      
      await transaction.save();

      // --- Process the payment (release to escrow) ---
      await processSuccessfulPayment(transaction);

    } else {
      // --- Handle FAILURE ---
      transaction.status = "failed";
      await transaction.save();

      // Rollback application status
      const application = await Application.findById(transaction.application);
      if (application && application.paymentStatus === "pending") {
        application.paymentStatus = "unpaid";
        application.transaction = null;
        await application.save();
      }

      // Notify client
      await Notification.create({
        user: transaction.client,
        title: "Payment Failed",
        message: `Payment for job failed: ${ResultDesc}`,
      });
    }

  } catch (error) {
    console.error("M-Pesa callback error:", error);
    // Don't throw - we already sent 200 OK
  }
};

  // PROCESS SUCCESSFUL PAYMENT (Escrow)
const processSuccessfulPayment = async (transaction) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // --- Update application ---
    const application = await Application.findById(transaction.application).session(session);
    if (!application) throw new Error("Application not found");

    // Prevent double processing
    if (application.paymentStatus === "escrow" || application.paymentStatus === "released") {
      console.log(`Application ${application._id} already processed.`);
      return;
    }

    application.paymentStatus = "escrow"; // ← Funds now in escrow
    application.paidAt = new Date();
    await application.save({ session });

    // --- Update job ---
    const job = await Job.findById(transaction.job).session(session);
    if (job) {
      job.paymentStatus = "escrow";
      job.escrowAmount = transaction.projectAmount;
      await job.save({ session });
    }

    // --- Activate contract ---
    const contract = await Contract.findOne({ 
      application: application._id 
    }).session(session);
    
    if (contract && contract.status === "draft") {
      contract.status = "active";
      contract.startedAt = new Date();
      await contract.save({ session });
    }

    // --- Update developer's PENDING balance (not available until release) ---
    const Wallet = mongoose.model("Wallet");
    let wallet = await Wallet.findOne({ 
      developer: transaction.developer 
    }).session(session);

    if (!wallet) {
      wallet = await Wallet.create({
        developer: transaction.developer,
        pendingBalance: 0,
        availableBalance: 0,
        totalEarned: 0,
      }, { session });
    }

    // Add to PENDING balance (not available until milestones are released)
    wallet.pendingBalance += transaction.developerAmount;
    wallet.totalEarned += transaction.developerAmount;
    await wallet.save({ session });

    // --- Commit transaction ---
    await session.commitTransaction();

    // --- Send notifications (outside transaction) ---
    const client = await User.findById(transaction.client);
    const developer = await User.findById(transaction.developer);

    await Notification.create({
      user: transaction.client,
      title: "Payment Successful",
      message: `Payment of ${transaction.amount} for "${job?.title}" was completed successfully. Funds are held in escrow.`,
    });

    await Notification.create({
      user: transaction.developer,
      title: "Payment Received",
      message: `Payment of ${transaction.developerAmount} for "${job?.title}" has been received and is held in escrow.`,
    });

    await sendPaymentConfirmationToClient({
      email: client.email,
      clientName: client.username,
      jobTitle: job?.title || "",
      amount: transaction.amount,
    });

    await sendPaymentReceivedEmail({
      email: developer.email,
      developerName: developer.username,
      jobTitle: job?.title || "",
      amount: transaction.developerAmount,
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("Error processing successful payment:", error);
    throw error;
  } finally {
    session.endSession();
  }
};

  // RELEASE MILESTONE (Developer gets paid)
export const releaseMilestone = async (req, res) => {
  try {
    const { jobId, milestoneId } = req.params;
    const { clientId } = req.body; // Admin or client confirmation

    // --- Find job ---
    const job = await Job.findById(jobId)
      .populate("client", "username email")
      .populate("hiredDeveloper", "username email");

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    // --- Authorization: Only client or admin can release ---
    if (req.user.role !== "admin" && job.client._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // --- Find milestone ---
    const milestone = job.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ success: false, message: "Milestone not found" });
    }

    if (milestone.status === "approved") {
      return res.status(400).json({ success: false, message: "Milestone already released" });
    }

    // --- Update milestone ---
    milestone.status = "approved";
    milestone.approvedAt = new Date();

    // --- Release funds ---
    const releasedAmount = milestone.amount;
    job.releasedAmount += releasedAmount;
    job.escrowAmount -= releasedAmount;

    if (job.releasedAmount >= job.budget) {
      job.paymentStatus = "paid";
      job.status = "Completed";
    }

    await job.save();

    // --- Find or create transaction for this release ---
    const releaseTransaction = await Transaction.create({
      transactionId: `REL-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type: "milestone_release",
      job: job._id,
      client: job.client._id,
      developer: job.hiredDeveloper._id,
      amount: releasedAmount,
      projectAmount: releasedAmount,
      platformFee: 0, // Already deducted at payment time
      developerAmount: releasedAmount,
      totalAmount: releasedAmount,
      paymentMethod: "wallet",
      status: "completed",
      escrowStatus: "released",
      releasedAt: new Date(),
      description: `Milestone "${milestone.title}" released`,
    });

    // --- Update wallet: Move from pending to available ---
    const Wallet = mongoose.model("Wallet");
    const wallet = await Wallet.findOne({ developer: job.hiredDeveloper._id });
    
    if (wallet) {
      wallet.pendingBalance -= releasedAmount;
      wallet.availableBalance += releasedAmount;
      await wallet.save();
    }

    // --- Notifications ---
    await Notification.create({
      user: job.hiredDeveloper._id,
      title: "Milestone Released",
      message: `Milestone "${milestone.title}" has been approved. ${releasedAmount} added to your available balance.`,
    });

    res.status(200).json({
      success: true,
      message: "Milestone released successfully",
      releasedAmount,
      remainingEscrow: job.escrowAmount,
      wallet: {
        availableBalance: wallet?.availableBalance || 0,
        pendingBalance: wallet?.pendingBalance || 0,
      },
    });

  } catch (error) {
    console.error("Milestone release error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

  // GET TRANSACTION STATUS
export const getTransactionStatus = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ 
      transactionId: req.params.transactionId 
    })
      .populate("job", "title budget status")
      .populate("client", "username email")
      .populate("developer", "username email");

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    // Authorization
    if (
      transaction.client?._id.toString() !== req.user.id &&
      transaction.developer?._id.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    res.status(200).json({
      success: true,
      transaction: {
        id: transaction.transactionId,
        type: transaction.type,
        amount: transaction.amount,
        status: transaction.status,
        escrowStatus: transaction.escrowStatus,
        paidAt: transaction.paidAt,
        releasedAt: transaction.releasedAt,
        mpesaReceipt: transaction.mpesa?.mpesaReceiptNumber,
        job: transaction.job,
        client: transaction.client,
        developer: transaction.developer,
      },
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

  // GET TRANSACTION HISTORY
export const getMyTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.user.role === "client") {
      filter.client = req.user.id;
    } else if (req.user.role === "developer") {
      filter.developer = req.user.id;
    } else if (req.user.role === "admin") {
      // Admin sees all
    } else {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (type) filter.type = type;
    if (status) filter.status = status;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate("job", "title budget status")
        .populate("client", "username")
        .populate("developer", "username")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: transactions.map(t => ({
        id: t.transactionId,
        type: t.type,
        amount: t.amount,
        developerAmount: t.developerAmount,
        status: t.status,
        escrowStatus: t.escrowStatus,
        createdAt: t.createdAt,
        job: t.job,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};