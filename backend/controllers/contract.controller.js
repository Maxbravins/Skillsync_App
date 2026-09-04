import Contract from "../models/contract.model.js";
import Application from "../models/application.model.js";
import Job from "../models/job.model.js";
import Notification from "../models/notification.model.js";
import { generatePDFContract } from "../services/pdf.service.js";

// ============================================
// 1. CREATE CONTRACT (After accepting application)
// ============================================
export const createContract = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { terms, milestones } = req.body;

    // --- Find application ---
    const application = await Application.findById(applicationId)
      .populate("job", "title budget client")
      .populate("developer", "username email");

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    if (application.status !== "accepted") {
      return res.status(400).json({ 
        success: false, 
        message: "Application must be accepted before creating a contract" 
      });
    }

    const job = application.job;

    // --- Check if contract already exists ---
    const existingContract = await Contract.findOne({ application: applicationId });
    if (existingContract) {
      return res.status(400).json({
        success: false,
        message: "Contract already exists for this application",
        contract: existingContract,
      });
    }

    // --- Calculate amounts ---
    const amount = job.budget;
    const commission = amount * 0.10; // 10%
    const developerAmount = amount - commission;

    // --- Create contract ---
    const contract = await Contract.create({
      job: job._id,
      application: application._id,
      client: job.client,
      developer: application.developer._id,
      amount,
      commission,
      developerAmount,
      terms: terms || "",
      milestones: milestones || [],
      status: "pending",
      clientSigned: false, // ← Client must sign
      developerSigned: false, // ← Developer must sign
    });

    // --- Generate PDF contract ---
    const pdfUrl = await generatePDFContract(contract);
    contract.pdfUrl = pdfUrl;
    await contract.save();

    // --- Notifications ---
    await Notification.create({
      user: application.developer._id,
      title: "Contract Ready",
      message: `A contract for "${job.title}" is ready for your review and signature.`,
    });

    await Notification.create({
      user: job.client,
      title: "Contract Created",
      message: `Contract for "${job.title}" has been created. Please review and sign.`,
    });

    res.status(201).json({
      success: true,
      message: "Contract created successfully",
      contract: {
        id: contract._id,
        amount: contract.amount,
        developerAmount: contract.developerAmount,
        status: contract.status,
        pdfUrl: contract.pdfUrl,
      },
    });

  } catch (error) {
    console.error("Contract creation error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// 2. SIGN CONTRACT (Client or Developer)
// ============================================
export const signContract = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { signature } = req.body; // Could be digital signature or checkbox

    const contract = await Contract.findById(contractId)
      .populate("job", "title")
      .populate("client", "username email")
      .populate("developer", "username email");

    if (!contract) {
      return res.status(404).json({ success: false, message: "Contract not found" });
    }

    // Determine who is signing
    let isClient = contract.client._id.toString() === req.user.id;
    let isDeveloper = contract.developer._id.toString() === req.user.id;

    if (!isClient && !isDeveloper && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to sign this contract" });
    }

    // Update signature status
    if (isClient || req.user.role === "admin") {
      contract.clientSigned = true;
      contract.clientSignedAt = new Date();
    }

    if (isDeveloper || req.user.role === "admin") {
      contract.developerSigned = true;
      contract.developerSignedAt = new Date();
    }

    // If both signed, activate contract
    if (contract.clientSigned && contract.developerSigned) {
      contract.status = "active";
      contract.startedAt = new Date();
      
      // Update application
      const application = await Application.findById(contract.application);
      if (application) {
        application.status = "accepted"; // Already should be
      }

      // Update job
      const job = await Job.findById(contract.job);
      if (job) {
        job.status = "In Progress";
        job.hiredDeveloper = contract.developer;
        await job.save();
      }

      // Notify both parties
      await Notification.create({
        user: contract.client._id,
        title: "Contract Signed",
        message: `Contract for "${contract.job.title}" has been signed by both parties. Work can now begin!`,
      });

      await Notification.create({
        user: contract.developer._id,
        title: "Contract Signed",
        message: `Contract for "${contract.job.title}" has been signed by both parties. You can now start working!`,
      });
    }

    await contract.save();

    res.status(200).json({
      success: true,
      message: "Contract signed successfully",
      contract: {
        clientSigned: contract.clientSigned,
        developerSigned: contract.developerSigned,
        status: contract.status,
      },
    });

  } catch (error) {
    console.error("Contract signing error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// 3. GET CONTRACT DETAILS
// ============================================
export const getContract = async (req, res) => {
  try {
    const { contractId } = req.params;

    const contract = await Contract.findById(contractId)
      .populate("job", "title description budget category")
      .populate("client", "username email profilePicture")
      .populate("developer", "username email profilePicture skills")
      .populate("application", "coverLetter status");

    if (!contract) {
      return res.status(404).json({ success: false, message: "Contract not found" });
    }

    // Authorization
    if (
      contract.client._id.toString() !== req.user.id &&
      contract.developer._id.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    res.status(200).json({
      success: true,
      contract: {
        id: contract._id,
        job: contract.job,
        amount: contract.amount,
        developerAmount: contract.developerAmount,
        commission: contract.commission,
        status: contract.status,
        clientSigned: contract.clientSigned,
        developerSigned: contract.developerSigned,
        startedAt: contract.startedAt,
        completedAt: contract.completedAt,
        pdfUrl: contract.pdfUrl,
        milestones: contract.milestones,
        createdAt: contract.createdAt,
      },
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// 4. GET MY CONTRACTS
// ============================================
export const getMyContracts = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.user.role === "client") {
      filter.client = req.user.id;
    } else if (req.user.role === "developer") {
      filter.developer = req.user.id;
    } else {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (status) filter.status = status;

    const [contracts, total] = await Promise.all([
      Contract.find(filter)
        .populate("job", "title budget")
        .populate("client", "username profilePicture")
        .populate("developer", "username profilePicture")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Contract.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: contracts,
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

// ============================================
// 5. COMPLETE CONTRACT
// ============================================
export const completeContract = async (req, res) => {
  try {
    const { contractId } = req.params;

    const contract = await Contract.findById(contractId)
      .populate("job", "title")
      .populate("client", "username")
      .populate("developer", "username");

    if (!contract) {
      return res.status(404).json({ success: false, message: "Contract not found" });
    }

    if (contract.status !== "active") {
      return res.status(400).json({ 
        success: false, 
        message: "Only active contracts can be completed" 
      });
    }

    // Only client or admin can complete
    if (
      contract.client._id.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    contract.status = "completed";
    contract.completedAt = new Date();

    // Update job
    const job = await Job.findById(contract.job);
    if (job) {
      job.status = "Completed";
      await job.save();
    }

    // Update application
    const application = await Application.findById(contract.application);
    if (application) {
      application.status = "completed";
      await application.save();
    }

    await contract.save();

    await Notification.create({
      user: contract.developer._id,
      title: "Contract Completed",
      message: `Contract for "${contract.job.title}" has been marked as completed.`,
    });

    res.status(200).json({
      success: true,
      message: "Contract completed successfully",
      contract,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// backend/controllers/contract.controller.js
// ... (your existing code above)

// ============================================
// 6. FUND CONTRACT (Client deposits money into escrow)
// ============================================
export const fundContract = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const contract = await Contract.findById(contractId)
      .populate("job", "title")
      .populate("client", "username email")
      .populate("developer", "username email");

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: "Contract not found",
      });
    }

    // Check if user is the client
    if (contract.client._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the client can fund this contract",
      });
    }

    // Check if already funded
    if (contract.paymentStatus === "paid" || contract.paymentStatus === "escrow") {
      return res.status(400).json({
        success: false,
        message: "Contract already funded",
      });
    }

    // Create transaction record
    const Transaction = mongoose.model("Transaction");
    const transaction = await Transaction.create({
      transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type: "project_payment",
      job: contract.job._id,
      client: req.user.id,
      developer: contract.developer._id,
      amount: contract.amount + contract.commission,
      projectAmount: contract.amount,
      platformFee: contract.commission,
      developerAmount: contract.developerAmount,
      totalAmount: contract.amount + contract.commission,
      paymentMethod: "mpesa",
      status: "pending",
      escrowStatus: "held",
      mpesa: {
        phoneNumber,
      },
      description: `Contract funding for ${contract.job.title}`,
    });

    // Update contract
    contract.transaction = transaction._id;
    contract.paymentStatus = "pending";
    await contract.save();

    // Here you would call your M-Pesa STK Push service
    // const mpesaResponse = await initiateSTKPush({
    //   phoneNumber,
    //   amount: transaction.totalAmount,
    //   accountReference: `Contract-${contract._id.toString().slice(-6)}`,
    //   transactionDesc: `Contract funding: ${contract.job.title}`,
    // });
    //
    // transaction.mpesa.checkoutRequestID = mpesaResponse.CheckoutRequestID;
    // await transaction.save();

    res.status(200).json({
      success: true,
      message: "Contract funding initiated. Please complete payment on your phone.",
      transaction: {
        id: transaction.transactionId,
        amount: transaction.totalAmount,
        status: transaction.status,
      },
      contract: {
        id: contract._id,
        paymentStatus: contract.paymentStatus,
      },
    });

  } catch (error) {
    console.error("Fund contract error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fund contract",
    });
  }
};

// ============================================
// 7. CONTRACT CALLBACK (M-Pesa webhook for contract funding)
// ============================================
export const contractCallback = async (req, res) => {
  try {
    const callback = req.body?.Body?.stkCallback;

    if (!callback) {
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;

    // Find transaction by CheckoutRequestID
    const Transaction = mongoose.model("Transaction");
    const transaction = await Transaction.findOne({
      "mpesa.checkoutRequestID": CheckoutRequestID,
    });

    if (!transaction) {
      console.log(`Transaction not found for CheckoutRequestID: ${CheckoutRequestID}`);
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // Update transaction with callback data
    transaction.mpesa.resultCode = ResultCode;
    transaction.mpesa.resultDesc = ResultDesc;

    if (ResultCode === 0) {
      // Payment successful
      const metadata = CallbackMetadata?.Item || [];
      const receipt = metadata.find(item => item.Name === "MpesaReceiptNumber");
      
      transaction.status = "completed";
      transaction.mpesa.mpesaReceiptNumber = receipt?.Value || "";
      transaction.paidAt = new Date();
      await transaction.save();

      // Update contract
      const contract = await Contract.findOne({ 
        transaction: transaction._id 
      }).populate("job", "title");

      if (contract) {
        contract.paymentStatus = "escrow";
        contract.status = "active";
        contract.startedAt = new Date();
        await contract.save();

        // Update job
        const job = await Job.findById(contract.job);
        if (job) {
          job.paymentStatus = "escrow";
          job.escrowAmount = transaction.projectAmount;
          await job.save();
        }

        // Add to developer's pending balance
        const Wallet = mongoose.model("Wallet");
        const wallet = await Wallet.findOne({ developer: contract.developer });
        if (wallet) {
          wallet.pendingBalance += transaction.developerAmount;
          wallet.totalEarned += transaction.developerAmount;
          await wallet.save();
        }

        // Notifications
        await Notification.create({
          user: contract.client,
          title: "Contract Funded",
          message: `Contract for "${contract.job.title}" has been funded. Funds are held in escrow.`,
        });

        await Notification.create({
          user: contract.developer,
          title: "Contract Funded",
          message: `Contract for "${contract.job.title}" has been funded. You can now start working.`,
        });
      }

    } else {
      // Payment failed
      transaction.status = "failed";
      await transaction.save();

      // Update contract
      const contract = await Contract.findOne({ 
        transaction: transaction._id 
      });

      if (contract) {
        contract.paymentStatus = "unpaid";
        await contract.save();
      }

      await Notification.create({
        user: transaction.client,
        title: "Contract Funding Failed",
        message: `Payment failed: ${ResultDesc}. Please try again.`,
      });
    }

    return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });

  } catch (error) {
    console.error("Contract callback error:", error);
    return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
};

// ============================================
// 8. RELEASE PAYMENT (Milestone release)
// ============================================
export const releasePayment = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { amount, milestoneId } = req.body;

    const contract = await Contract.findById(contractId)
      .populate("job", "title")
      .populate("client", "username email")
      .populate("developer", "username email");

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: "Contract not found",
      });
    }

    // Check if user is the client or admin
    if (
      contract.client._id.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the client or admin can release payment",
      });
    }

    // Check if contract is active
    if (contract.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Contract must be active to release payment",
      });
    }

    // Check if funds are in escrow
    if (contract.paymentStatus !== "escrow") {
      return res.status(400).json({
        success: false,
        message: "Funds must be in escrow before releasing payment",
      });
    }

    // Determine release amount
    let releaseAmount = amount || contract.developerAmount;

    // Check if there's enough in escrow
    const job = await Job.findById(contract.job);
    if (job && releaseAmount > job.escrowAmount) {
      return res.status(400).json({
        success: false,
        message: `Amount exceeds escrow balance. Available: ${job.escrowAmount}`,
      });
    }

    // Create release transaction
    const Transaction = mongoose.model("Transaction");
    const releaseTransaction = await Transaction.create({
      transactionId: `REL-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type: "milestone_release",
      job: contract.job._id,
      client: contract.client._id,
      developer: contract.developer._id,
      amount: releaseAmount,
      projectAmount: releaseAmount,
      developerAmount: releaseAmount,
      totalAmount: releaseAmount,
      paymentMethod: "wallet",
      status: "completed",
      escrowStatus: "released",
      releasedAt: new Date(),
      description: `Milestone release for ${contract.job.title}`,
    });

    // Update wallet
    const Wallet = mongoose.model("Wallet");
    const wallet = await Wallet.findOne({ developer: contract.developer._id });
    if (wallet) {
      wallet.pendingBalance -= releaseAmount;
      wallet.availableBalance += releaseAmount;
      await wallet.save();
    }

    // Update job escrow
    if (job) {
      job.escrowAmount -= releaseAmount;
      job.releasedAmount += releaseAmount;
      
      if (job.escrowAmount <= 0) {
        job.paymentStatus = "paid";
        job.status = "Completed";
      }
      await job.save();
    }

    // Update contract
    if (milestoneId) {
      const milestone = contract.milestones?.id(milestoneId);
      if (milestone) {
        milestone.status = "approved";
        milestone.approvedAt = new Date();
      }
    }

    contract.paymentStatus = job?.escrowAmount <= 0 ? "released" : "escrow";
    contract.releasedAt = new Date();
    contract.releasedBy = req.user.id;
    await contract.save();

    // Notifications
    await Notification.create({
      user: contract.developer._id,
      title: "Payment Released",
      message: `Payment of ${releaseAmount} has been released for "${contract.job.title}".`,
    });

    res.status(200).json({
      success: true,
      message: "Payment released successfully",
      releaseAmount,
      remainingEscrow: job?.escrowAmount || 0,
      wallet: {
        availableBalance: wallet?.availableBalance || 0,
        pendingBalance: wallet?.pendingBalance || 0,
      },
    });

  } catch (error) {
    console.error("Release payment error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to release payment",
    });
  }
};