import mongoose from "mongoose";

import Application from "../models/application.model.js";
import Job from "../models/job.model.js";
import Transaction from "../models/transaction.model.js";
import Notification from "../models/notification.model.js";
import Contract from "../models/contract.model.js";
import Wallet from "../models/wallet.model.js";
import User from "../models/user.model.js";

import { initiateSTKPush } from "../services/mpesa.service.js";
import { calculateCommission } from "../services/platformFee.service.js";

import {
  sendPaymentConfirmationToClient,
  sendPaymentReceivedEmail,
} from "../services/email.service.js";


// ============================================================
// 1. INITIATE PAYMENT
// Client pays for accepted application
// ============================================================

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

    // ----------------------------------------------------------
    // Find application
    // ----------------------------------------------------------

    const application = await Application.findById(applicationId)
      .populate("job")
      .populate("developer", "username email");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // ----------------------------------------------------------
    // Validate application
    // ----------------------------------------------------------

    if (application.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Only accepted applications can be paid for.",
      });
    }

    if (
      ["escrow", "released"].includes(
        application.paymentStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "This application has already been paid for.",
      });
    }

    const job = application.job;

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "The job associated with this application no longer exists.",
      });
    }

    // ----------------------------------------------------------
    // Authorization
    // ----------------------------------------------------------

    if (job.client.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized.",
      });
    }

    // ----------------------------------------------------------
    // Prevent duplicate pending payments
    // ----------------------------------------------------------

    const existingTransaction = await Transaction.findOne({
      application: application._id,
      type: "project_payment",
      status: {
        $in: ["pending", "processing"],
      },
    });

    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message: "A payment is already in progress for this application.",
        transactionId: existingTransaction.transactionId,
      });
    }

    // ----------------------------------------------------------
    // Calculate amounts
    //
    // amount         = project amount
    // platformFee    = platform commission
    // totalAmount    = amount + platformFee
    // developerAmount = amount - platformFee
    // ----------------------------------------------------------

    const projectAmount = Number(job.budget);

    if (!Number.isFinite(projectAmount) || projectAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid project budget.",
      });
    }

    const platformFee = calculateCommission(projectAmount);

    const developerAmount =
      projectAmount - platformFee;

    const totalAmount =
      projectAmount + platformFee;

    // ----------------------------------------------------------
    // Initiate M-Pesa STK Push
    // ----------------------------------------------------------

    let stkResponse;

    try {
      stkResponse = await initiateSTKPush({
        phoneNumber,
        amount: totalAmount,
        accountReference: `SkillSync-${job._id
          .toString()
          .slice(-6)}`,
        transactionDesc: `Escrow payment for: ${job.title}`,
      });
    } catch (error) {
      console.error("M-Pesa STK Push error:", error);

      return res.status(502).json({
        success: false,
        message:
          error.message ||
          "M-Pesa could not initiate the payment request.",
      });
    }

    if (!stkResponse?.CheckoutRequestID) {
      return res.status(502).json({
        success: false,
        message: "M-Pesa did not return a checkout request ID.",
      });
    }

    // ----------------------------------------------------------
    // Create transaction
    // ----------------------------------------------------------

    const transaction = await Transaction.create({
      type: "project_payment",

      application: application._id,
      job: job._id,

      client: req.user.id,
      developer: application.developer._id,

      // Financial values
      amount: projectAmount,
      platformFee,
      developerAmount,
      totalAmount,

      currency: "KES",

      paymentMethod: "mpesa",
      status: "pending",

      // Escrow will only be held after successful callback
      escrowStatus: null,

      mpesa: {
        merchantRequestID:
          stkResponse.MerchantRequestID || "",

        checkoutRequestID:
          stkResponse.CheckoutRequestID,

        phoneNumber,
      },

      description:
        `Escrow payment for: ${job.title}`,
    });

    // ----------------------------------------------------------
    // Update application
    // ----------------------------------------------------------

    application.transaction = transaction._id;
    application.paymentStatus = "pending";

    await application.save();

    // IMPORTANT:
    // Do NOT put the job into escrow here.
    // M-Pesa has not confirmed payment yet.

    return res.status(200).json({
      success: true,
      message:
        "STK Push sent successfully. Please complete payment on your phone.",

      transaction: {
        transactionId: transaction.transactionId,
        checkoutRequestID:
          transaction.mpesa.checkoutRequestID,
        amount: transaction.amount,
        platformFee: transaction.platformFee,
        totalAmount: transaction.totalAmount,
        status: transaction.status,
      },
    });
  } catch (error) {
    console.error("Payment initiation error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Payment initiation failed.",
    });
  }
};


// ============================================================
// 2. M-PESA CALLBACK
// ============================================================

export const mpesaCallback = async (req, res) => {
  try {
    // ----------------------------------------------------------
    // Acknowledge M-Pesa immediately
    // ----------------------------------------------------------

    res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });

    const callback =
      req.body?.Body?.stkCallback;

    if (!callback) {
      console.error(
        "Invalid M-Pesa callback:",
        req.body
      );
      return;
    }

    const {
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = callback;

    if (!CheckoutRequestID) {
      console.error(
        "M-Pesa callback missing CheckoutRequestID"
      );
      return;
    }

    // ----------------------------------------------------------
    // Find transaction
    // ----------------------------------------------------------

    const transaction =
      await Transaction.findOne({
        "mpesa.checkoutRequestID":
          CheckoutRequestID,
      });

    if (!transaction) {
      console.error(
        `Transaction not found for CheckoutRequestID: ${CheckoutRequestID}`
      );
      return;
    }

    // ----------------------------------------------------------
    // Idempotency
    // ----------------------------------------------------------

    if (
      ["completed", "failed", "refunded"].includes(
        transaction.status
      )
    ) {
      console.log(
        `Transaction ${transaction.transactionId} already processed.`
      );

      return;
    }

    // ----------------------------------------------------------
    // Store callback information
    // ----------------------------------------------------------

    transaction.mpesa.resultCode =
      ResultCode;

    transaction.mpesa.resultDesc =
      ResultDesc || "";

    // ----------------------------------------------------------
    // PAYMENT SUCCESS
    // ----------------------------------------------------------

    if (Number(ResultCode) === 0) {
      const metadata =
        CallbackMetadata?.Item || [];

      const receipt = metadata.find(
        (item) =>
          item.Name === "MpesaReceiptNumber"
      );

      const paidAmountItem = metadata.find(
        (item) => item.Name === "Amount"
      );

      const paidAmount = Number(
        paidAmountItem?.Value
      );

      const receiptNumber =
        receipt?.Value || "";

      // --------------------------------------------------------
      // Verify amount
      // --------------------------------------------------------

      if (
        Number.isFinite(paidAmount) &&
        paidAmount !== transaction.totalAmount
      ) {
        await transaction.save();

        await transaction.markForReview(
          `M-Pesa amount mismatch. Expected ${transaction.totalAmount}, received ${paidAmount}.`
        );

        console.error(
          `Payment amount mismatch for ${transaction.transactionId}. Expected ${transaction.totalAmount}, received ${paidAmount}.`
        );

        return;
      }

      // --------------------------------------------------------
      // Mark transaction completed
      // --------------------------------------------------------

      await transaction.markCompleted(
        receiptNumber
      );

      // --------------------------------------------------------
      // Process successful payment
      // --------------------------------------------------------

      await processSuccessfulPayment(
        transaction
      );

      return;
    }

    // ----------------------------------------------------------
    // PAYMENT FAILED
    // ----------------------------------------------------------

    await transaction.markFailed(
      ResultDesc || "M-Pesa payment failed"
    );

    // ----------------------------------------------------------
    // Roll back application
    // ----------------------------------------------------------

    const application =
      await Application.findById(
        transaction.application
      );

    if (
      application &&
      application.paymentStatus === "pending"
    ) {
      application.paymentStatus = "unpaid";
      application.transaction = null;

      await application.save();
    }

    // ----------------------------------------------------------
    // Notify client
    // ----------------------------------------------------------

    await Notification.create({
      user: transaction.client,
      title: "Payment Failed",
      message: `Payment for your project failed: ${
        ResultDesc || "Unknown payment error"
      }.`,
    });
  } catch (error) {
    console.error(
      "M-Pesa callback error:",
      error
    );

    // M-Pesa has already received 200 response.
    // Do not throw.
  }
};


// ============================================================
// 3. PROCESS SUCCESSFUL PAYMENT
// Move project funds into escrow
// ============================================================

const processSuccessfulPayment = async (
  transaction
) => {
  const session =
    await mongoose.startSession();

  try {
    session.startTransaction();

    // ----------------------------------------------------------
    // Application
    // ----------------------------------------------------------

    const application =
      await Application.findById(
        transaction.application
      ).session(session);

    if (!application) {
      throw new Error(
        "Application not found"
      );
    }

    // Idempotency
    if (
      ["escrow", "released"].includes(
        application.paymentStatus
      )
    ) {
      await session.commitTransaction();

      console.log(
        `Application ${application._id} already processed.`
      );

      return;
    }

    application.paymentStatus = "escrow";
    application.paidAt = new Date();

    await application.save({
      session,
    });

    // ----------------------------------------------------------
    // Job
    // ----------------------------------------------------------

    const job =
      await Job.findById(
        transaction.job
      ).session(session);

    if (!job) {
      throw new Error(
        "Job not found"
      );
    }

    job.paymentStatus = "escrow";

    job.escrowAmount =
      (job.escrowAmount || 0) +
      transaction.amount;

    await job.save({
      session,
    });

    // ----------------------------------------------------------
    // Contract
    // ----------------------------------------------------------

    const contract =
      await Contract.findOne({
        application: application._id,
      }).session(session);

    if (contract) {
      contract.paymentStatus = "escrow";

      if (contract.status === "pending") {
        contract.status = "active";
        contract.startedAt =
          contract.startedAt || new Date();
      }

      contract.transaction =
        transaction._id;

      await contract.save({
        session,
      });
    }

    // ----------------------------------------------------------
    // Developer wallet
    //
    // Money is pending until client releases it.
    // ----------------------------------------------------------

    let wallet =
      await Wallet.findOne({
        developer:
          transaction.developer,
      }).session(session);

    if (!wallet) {
      wallet = new Wallet({
        developer:
          transaction.developer,

        pendingBalance: 0,
        availableBalance: 0,
        totalEarned: 0,
      });

      await wallet.save({
        session,
      });
    }

    wallet.pendingBalance =
      (wallet.pendingBalance || 0) +
      transaction.developerAmount;

    wallet.totalEarned =
      (wallet.totalEarned || 0) +
      transaction.developerAmount;

    await wallet.save({
      session,
    });

    // ----------------------------------------------------------
    // Commit database changes
    // ----------------------------------------------------------

    await session.commitTransaction();

    // ----------------------------------------------------------
    // Notifications / emails
    // Do these AFTER commit.
    // ----------------------------------------------------------

    const client =
      await User.findById(
        transaction.client
      ).select("username email");

    const developer =
      await User.findById(
        transaction.developer
      ).select("username email");

    await Notification.create({
      user: transaction.client,
      title: "Payment Successful",
      message: `Payment of ${transaction.totalAmount} ${transaction.currency} for "${job.title}" was completed successfully. Funds are now held in escrow.`,
    });

    await Notification.create({
      user: transaction.developer,
      title: "Payment Received",
      message: `Payment of ${transaction.developerAmount} ${transaction.currency} for "${job.title}" has been received and is currently held in escrow.`,
    });

    if (client?.email) {
      await sendPaymentConfirmationToClient({
        email: client.email,
        clientName: client.username,
        jobTitle: job.title,
        amount: transaction.totalAmount,
      });
    }

    if (developer?.email) {
      await sendPaymentReceivedEmail({
        email: developer.email,
        developerName: developer.username,
        jobTitle: job.title,
        amount: transaction.developerAmount,
      });
    }
  } catch (error) {
    await session.abortTransaction();

    console.error(
      "Error processing successful payment:",
      error
    );

    throw error;
  } finally {
    await session.endSession();
  }
};


// ============================================================
// 4. RELEASE MILESTONE
// ============================================================

export const releaseMilestone = async (
  req,
  res
) => {
  const session =
    await mongoose.startSession();

  try {
    const {
      jobId,
      milestoneId,
    } = req.params;

    // ----------------------------------------------------------
    // Find job
    // ----------------------------------------------------------

    const job =
      await Job.findById(jobId)
        .populate(
          "client",
          "username email"
        )
        .populate(
          "hiredDeveloper",
          "username email"
        );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // ----------------------------------------------------------
    // Authorization
    // ----------------------------------------------------------

    if (
      req.user.role !== "admin" &&
      job.client._id.toString() !==
        req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    // ----------------------------------------------------------
    // Validate developer
    // ----------------------------------------------------------

    if (!job.hiredDeveloper) {
      return res.status(400).json({
        success: false,
        message:
          "This job does not have a hired developer.",
      });
    }

    // ----------------------------------------------------------
    // Find milestone
    // ----------------------------------------------------------

    const milestone =
      job.milestones?.id(
        milestoneId
      );

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: "Milestone not found",
      });
    }

    if (milestone.status === "approved") {
      return res.status(400).json({
        success: false,
        message:
          "Milestone has already been released.",
      });
    }

    // ----------------------------------------------------------
    // Validate escrow
    // ----------------------------------------------------------

    const releasedAmount =
      Number(milestone.amount);

    if (
      !Number.isFinite(releasedAmount) ||
      releasedAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid milestone amount.",
      });
    }

    if (
      (job.escrowAmount || 0) <
      releasedAmount
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Milestone amount exceeds available escrow.",
      });
    }

    // ----------------------------------------------------------
    // Start transaction
    // ----------------------------------------------------------

    session.startTransaction();

    // ----------------------------------------------------------
    // Update milestone
    // ----------------------------------------------------------

    milestone.status = "approved";
    milestone.approvedAt = new Date();

    job.releasedAmount =
      (job.releasedAmount || 0) +
      releasedAmount;

    job.escrowAmount =
      (job.escrowAmount || 0) -
      releasedAmount;

    if (job.escrowAmount <= 0) {
      job.escrowAmount = 0;
      job.paymentStatus = "paid";
      job.status = "Completed";
    }

    await job.save({
      session,
    });

    // ----------------------------------------------------------
    // Find associated contract
    // ----------------------------------------------------------

    const contract =
      await Contract.findOne({
        job: job._id,
        developer:
          job.hiredDeveloper._id,
      }).session(session);

    // ----------------------------------------------------------
    // Create release transaction
    // ----------------------------------------------------------

    const releaseTransaction =
      await Transaction.create(
        [
          {
            type: "milestone_release",

            job: job._id,

            client: job.client._id,

            developer:
              job.hiredDeveloper._id,

            contract:
              contract?._id || null,

            milestone:
              milestone._id,

            // For a release, the amount being moved
            // is the developer's payment.
            amount: releasedAmount,

            platformFee: 0,

            developerAmount:
              releasedAmount,

            totalAmount:
              releasedAmount,

            currency:
              "KES",

            paymentMethod:
              "wallet",

            status:
              "completed",

            escrowStatus:
              "released",

            releasedAt:
              new Date(),

            completedAt:
              new Date(),

            description:
              `Milestone "${milestone.title}" released`,
          },
        ],
        { session }
      );

    // ----------------------------------------------------------
    // Release transaction is already completed/released.
    // No separate holdInEscrow() call is needed.
    // ----------------------------------------------------------

    // ----------------------------------------------------------
    // Update developer wallet
    // ----------------------------------------------------------

    const wallet =
      await Wallet.findOne({
        developer:
          job.hiredDeveloper._id,
      }).session(session);

    if (!wallet) {
      throw new Error(
        "Developer wallet not found"
      );
    }

    if (
      (wallet.pendingBalance || 0) <
      releasedAmount
    ) {
      throw new Error(
        "Developer pending balance is insufficient for this release."
      );
    }

    wallet.pendingBalance -=
      releasedAmount;

    wallet.availableBalance =
      (wallet.availableBalance || 0) +
      releasedAmount;

    await wallet.save({
      session,
    });

    // ----------------------------------------------------------
    // Update contract
    // ----------------------------------------------------------

    if (contract) {
      contract.releasedAt =
        new Date();

      contract.releasedBy =
        req.user.id;

      if (job.escrowAmount <= 0) {
        contract.paymentStatus =
          "released";
        contract.status =
          "completed";
        contract.completedAt =
          new Date();
      } else {
        contract.paymentStatus =
          "escrow";
      }

      await contract.save({
        session,
      });
    }

    // ----------------------------------------------------------
    // Commit
    // ----------------------------------------------------------

    await session.commitTransaction();

    // ----------------------------------------------------------
    // Notification
    // ----------------------------------------------------------

    await Notification.create({
      user:
        job.hiredDeveloper._id,

      title:
        "Milestone Released",

      message:
        `Milestone "${milestone.title}" has been approved. ${releasedAmount} ${"KES"} has been added to your available balance.`,
    });

    return res.status(200).json({
      success: true,
      message:
        "Milestone released successfully",

      releasedAmount,

      remainingEscrow:
        job.escrowAmount,

      wallet: {
        availableBalance:
          wallet.availableBalance,

        pendingBalance:
          wallet.pendingBalance,
      },

      transaction:
        releaseTransaction[0].transactionId,
    });
  } catch (error) {
    await session.abortTransaction();

    console.error(
      "Milestone release error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to release milestone.",
    });
  } finally {
    await session.endSession();
  }
};


// ============================================================
// 5. GET TRANSACTION STATUS
// ============================================================

export const getTransactionStatus = async (
  req,
  res
) => {
  try {
    const transaction =
      await Transaction.findOne({
        transactionId:
          req.params.transactionId,
      })
        .populate(
          "job",
          "title budget status"
        )
        .populate(
          "client",
          "username email"
        )
        .populate(
          "developer",
          "username email"
        );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // ----------------------------------------------------------
    // Authorization
    // ----------------------------------------------------------

    const userId =
      req.user.id.toString();

    const isClient =
      transaction.client?._id?.toString() ===
      userId;

    const isDeveloper =
      transaction.developer?._id?.toString() ===
      userId;

    const isAdmin =
      req.user.role === "admin";

    if (
      !isClient &&
      !isDeveloper &&
      !isAdmin
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    return res.status(200).json({
      success: true,

      transaction: {
        id:
          transaction.transactionId,

        type:
          transaction.type,

        amount:
          transaction.amount,

        platformFee:
          transaction.platformFee,

        developerAmount:
          transaction.developerAmount,

        totalAmount:
          transaction.totalAmount,

        currency:
          transaction.currency,

        status:
          transaction.status,

        escrowStatus:
          transaction.escrowStatus,

        paymentMethod:
          transaction.paymentMethod,

        paidAt:
          transaction.paidAt,

        completedAt:
          transaction.completedAt,

        releasedAt:
          transaction.releasedAt,

        mpesaReceipt:
          transaction.mpesa
            ?.mpesaReceiptNumber,

        review:
          transaction.review,

        job:
          transaction.job,

        client:
          transaction.client,

        developer:
          transaction.developer,
      },
    });
  } catch (error) {
    console.error(
      "Get transaction status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ============================================================
// 6. GET MY TRANSACTIONS
// ============================================================

export const getMyTransactions = async (
  req,
  res
) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      status,
      escrowStatus,
    } = req.query;

    const parsedPage =
      Math.max(parseInt(page) || 1, 1);

    const parsedLimit =
      Math.min(
        Math.max(
          parseInt(limit) || 20,
          1
        ),
        100
      );

    const skip =
      (parsedPage - 1) *
      parsedLimit;

    // ----------------------------------------------------------
    // Build filter
    // ----------------------------------------------------------

    const filter = {};

    if (req.user.role === "client") {
      filter.client = req.user.id;
    } else if (
      req.user.role === "developer"
    ) {
      filter.developer = req.user.id;
    } else if (
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (type) {
      filter.type = type;
    }

    if (status) {
      filter.status = status;
    }

    if (escrowStatus) {
      filter.escrowStatus =
        escrowStatus;
    }

    // ----------------------------------------------------------
    // Query
    // ----------------------------------------------------------

    const [
      transactions,
      total,
    ] = await Promise.all([
      Transaction.find(filter)
        .populate(
          "job",
          "title budget status"
        )
        .populate(
          "client",
          "username"
        )
        .populate(
          "developer",
          "username"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(parsedLimit),

      Transaction.countDocuments(
        filter
      ),
    ]);

    return res.status(200).json({
      success: true,

      data: transactions.map(
        (transaction) => ({
          id:
            transaction.transactionId,

          type:
            transaction.type,

          amount:
            transaction.amount,

          platformFee:
            transaction.platformFee,

          developerAmount:
            transaction.developerAmount,

          totalAmount:
            transaction.totalAmount,

          currency:
            transaction.currency,

          status:
            transaction.status,

          escrowStatus:
            transaction.escrowStatus,

          paymentMethod:
            transaction.paymentMethod,

          createdAt:
            transaction.createdAt,

          paidAt:
            transaction.paidAt,

          completedAt:
            transaction.completedAt,

          releasedAt:
            transaction.releasedAt,

          job:
            transaction.job,
        })
      ),

      pagination: {
        page:
          parsedPage,

        limit:
          parsedLimit,

        total,

        pages:
          Math.ceil(
            total / parsedLimit
          ),
      },
    });
  } catch (error) {
    console.error(
      "Get transaction history error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
