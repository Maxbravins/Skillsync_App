import Contract from "../models/contract.model.js";
import Application from "../models/application.model.js";
import Job from "../models/job.model.js";
import Transaction from "../models/transaction.model.js";
import Notification from "../models/notification.model.js";

import paymentService from "../services/payment.service.js";
import { generatePDFContract } from "../services/pdf.service.js";
import {
  calculateCommission,
  calculateDeveloperAmount,
} from "../services/platformFee.service.js";

// ============================================================
// HELPER
// ============================================================

const createNotification = async (user, message) => {
  if (!user || !message) return;

  await Notification.create({
    user,
    message,
  });
};

// ============================================================
// 1. CREATE CONTRACT
// ============================================================
// Contract is normally created after an application is accepted.
//
// IMPORTANT:
// application.controller.js also creates contracts.
// Therefore this endpoint checks for an existing contract first.
// ============================================================

export const createContract = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { terms, milestones } = req.body;

    const application = await Application.findById(applicationId)
      .populate("job", "title description budget platformFeeAmount client")
      .populate("developer", "username email");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (!application.job) {
      return res.status(404).json({
        success: false,
        message: "The job associated with this application no longer exists",
      });
    }

    const job = application.job;

    // Only the client who owns the job can create the contract.
    if (
      job.client.toString() !== req.user.id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to create this contract",
      });
    }

    if (application.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message:
          "Application must be accepted before creating a contract",
      });
    }

    // Prevent duplicate contracts.
    const existingContract = await Contract.findOne({
      application: application._id,
    });

    if (existingContract) {
      return res.status(200).json({
        success: true,
        message: "Contract already exists",
        contract: existingContract,
      });
    }

    // ----------------------------------------------------------
    // CALCULATE FINANCIAL VALUES
    // ----------------------------------------------------------

    const amount = job.budget;

    const commission =
      job.platformFeeAmount ??
      calculateCommission(amount);

    const developerAmount =
      calculateDeveloperAmount(amount);

    // ----------------------------------------------------------
    // CREATE CONTRACT
    // ----------------------------------------------------------

    const contract = await Contract.create({
      job: job._id,
      application: application._id,

      client: job.client,
      developer: application.developer._id,

      amount,
      commission,
      developerAmount,

      paymentStatus: "unpaid",
      transaction: null,

      terms: terms || undefined,
      milestones: milestones || undefined,

      status: "pending",

      clientSigned: false,
      developerSigned: false,
    });

    // Link contract to application.
    application.contract = contract._id;
    await application.save();

    // ----------------------------------------------------------
    // NOTIFICATIONS
    // ----------------------------------------------------------

    await createNotification(
      application.developer._id,
      `A contract for "${job.title}" has been created and is ready for your review and signature.`
    );

    await createNotification(
      job.client,
      `Contract for "${job.title}" has been created. Please review and sign.`
    );

    return res.status(201).json({
      success: true,
      message: "Contract created successfully",
      contract,
    });
  } catch (error) {
    console.error("Create contract error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// 2. SIGN CONTRACT
// ============================================================

export const signContract = async (req, res) => {
  try {
    const { contractId } = req.params;

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

    const userId = req.user.id.toString();

    const isClient =
      contract.client._id.toString() === userId;

    const isDeveloper =
      contract.developer._id.toString() === userId;

    const isAdmin = req.user.role === "admin";

    if (!isClient && !isDeveloper && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to sign this contract",
      });
    }

    // ----------------------------------------------------------
    // PREVENT SIGNING CANCELLED/COMPLETED CONTRACT
    // ----------------------------------------------------------

    if (
      ["cancelled", "completed"].includes(contract.status)
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot sign a ${contract.status} contract`,
      });
    }

    // ----------------------------------------------------------
    // RECORD SIGNATURE
    // ----------------------------------------------------------

    if (isClient || isAdmin) {
      if (!contract.clientSigned) {
        contract.clientSigned = true;
      }
    }

    if (isDeveloper || isAdmin) {
      if (!contract.developerSigned) {
        contract.developerSigned = true;
      }
    }

    // ----------------------------------------------------------
    // ACTIVATE WHEN BOTH HAVE SIGNED
    // ----------------------------------------------------------

    let activated = false;

    if (
      contract.clientSigned &&
      contract.developerSigned &&
      contract.status === "pending"
    ) {
      contract.status = "active";
      contract.startedAt = new Date();

      activated = true;

      const job = await Job.findById(contract.job._id);

      if (job) {
        job.hiredDeveloper = contract.developer._id;

        if (job.status !== "Completed") {
          job.status = "In Progress";
        }

        await job.save();
      }

      await createNotification(
        contract.client._id,
        `Contract for "${contract.job.title}" has been signed by both parties.`
      );

      await createNotification(
        contract.developer._id,
        `Contract for "${contract.job.title}" has been signed by both parties.`
      );
    }

    await contract.save();

    return res.status(200).json({
      success: true,
      message: activated
        ? "Contract signed and activated successfully"
        : "Contract signed successfully",
      contract: {
        id: contract._id,
        clientSigned: contract.clientSigned,
        developerSigned: contract.developerSigned,
        status: contract.status,
        startedAt: contract.startedAt,
      },
    });
  } catch (error) {
    console.error("Sign contract error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// 3. GET CONTRACT
// ============================================================

export const getContract = async (req, res) => {
  try {
    const { contractId } = req.params;

    const contract = await Contract.findById(contractId)
      .populate(
        "job",
        "title description budget category status paymentStatus"
      )
      .populate(
        "client",
        "username email profilePicture"
      )
      .populate(
        "developer",
        "username email profilePicture skills"
      )
      .populate(
        "application",
        "coverLetter proposedBudget proposedTimeline status"
      )
      .populate(
        "transaction",
        "transactionId type amount platformFee developerAmount totalAmount currency status escrowStatus"
      );

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: "Contract not found",
      });
    }

    const userId = req.user.id.toString();

    const authorized =
      contract.client._id.toString() === userId ||
      contract.developer._id.toString() === userId ||
      req.user.role === "admin";

    if (!authorized) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this contract",
      });
    }

    return res.status(200).json({
      success: true,
      contract,
    });
  } catch (error) {
    console.error("Get contract error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// 4. GET MY CONTRACTS
// ============================================================

export const getMyContracts = async (req, res) => {
  try {
    const {
      status,
      page = 1,
      limit = 10,
    } = req.query;

    const parsedPage = Math.max(
      1,
      parseInt(page, 10) || 1
    );

    const parsedLimit = Math.min(
      100,
      Math.max(
        1,
        parseInt(limit, 10) || 10
      )
    );

    const skip =
      (parsedPage - 1) * parsedLimit;

    const filter = {};

    if (req.user.role === "client") {
      filter.client = req.user.id;
    } else if (req.user.role === "developer") {
      filter.developer = req.user.id;
    } else if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (status) {
      filter.status = status;
    }

    const [contracts, total] =
      await Promise.all([
        Contract.find(filter)
          .populate("job", "title budget status")
          .populate(
            "client",
            "username profilePicture"
          )
          .populate(
            "developer",
            "username profilePicture"
          )
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parsedLimit),

        Contract.countDocuments(filter),
      ]);

    return res.status(200).json({
      success: true,
      data: contracts,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(
          total / parsedLimit
        ),
      },
    });
  } catch (error) {
    console.error("Get my contracts error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// 5. COMPLETE CONTRACT
// ============================================================

export const completeContract = async (req, res) => {
  try {
    const { contractId } = req.params;

    const contract = await Contract.findById(contractId)
      .populate("job", "title")
      .populate("client", "username")
      .populate("developer", "username");

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: "Contract not found",
      });
    }

    if (contract.status !== "active") {
      return res.status(400).json({
        success: false,
        message:
          "Only active contracts can be completed",
      });
    }

    const isClient =
      contract.client._id.toString() ===
      req.user.id.toString();

    const isAdmin =
      req.user.role === "admin";

    if (!isClient && !isAdmin) {
      return res.status(403).json({
        success: false,
        message:
          "Only the client or admin can complete this contract",
      });
    }

    contract.status = "completed";
    contract.completedAt = new Date();

    await contract.save();

    const job = await Job.findById(contract.job._id);

    if (job) {
      job.status = "Completed";
      await job.save();
    }

    await createNotification(
      contract.developer._id,
      `Contract for "${contract.job.title}" has been marked as completed.`
    );

    return res.status(200).json({
      success: true,
      message: "Contract completed successfully",
      contract,
    });
  } catch (error) {
    console.error("Complete contract error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// 6. FUND CONTRACT
// ============================================================
// Uses the EXISTING PaymentService.
// We do NOT create another Transaction here.
// ============================================================

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

    const contract = await Contract.findById(
      contractId
    )
      .populate("job", "title status")
      .populate(
        "client",
        "username email"
      )
      .populate(
        "developer",
        "username email"
      );

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: "Contract not found",
      });
    }

    if (
      contract.client._id.toString() !==
      req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only the client can fund this contract",
      });
    }

    if (
      contract.paymentStatus === "paid"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This contract has already been funded",
      });
    }

    if (
      contract.paymentStatus === "pending"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A payment for this contract is already being processed",
      });
    }

    if (!contract.job) {
      return res.status(404).json({
        success: false,
        message: "Associated job not found",
      });
    }

    // ----------------------------------------------------------
    // PAYMENT SERVICE EXPECTS A JOB
    // ----------------------------------------------------------

    const result =
      await paymentService.initiateJobPayment({
        jobId: contract.job._id,
        clientId: req.user.id,
        phoneNumber,
      });

    const transaction =
      result.transaction;

    // Link transaction to contract.
    contract.transaction =
      transaction._id;

    contract.paymentStatus =
      "pending";

    await contract.save();

    return res.status(200).json({
      success: true,
      message:
        "Contract funding initiated. Please complete the M-Pesa payment on your phone.",
      transaction: {
        id: transaction._id,
        transactionId:
          transaction.transactionId,
        amount:
          transaction.amount,
        platformFee:
          transaction.platformFee,
        totalAmount:
          transaction.totalAmount,
        status:
          transaction.status,
      },
      contract: {
        id: contract._id,
        paymentStatus:
          contract.paymentStatus,
      },
      providerResponse:
        result.providerResponse || null,
    });
  } catch (error) {
    console.error("Fund contract error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fund contract",
    });
  }
};

// ============================================================
// 7. CONTRACT PAYMENT CALLBACK
// ============================================================
// Prefer the central payment callback/service.
// This controller remains as a compatibility endpoint.
//
// The actual payment processing belongs in PaymentService.
// ============================================================

export const contractCallback = async (
  req,
  res
) => {
  try {
    const callback =
      req.body?.Body?.stkCallback;

    if (!callback) {
      return res.status(200).json({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = callback;

    const items =
      CallbackMetadata?.Item || [];

    const callbackMetadata = {};

    for (const item of items) {
      if (item?.Name) {
        callbackMetadata[item.Name] =
          item.Value;
      }
    }

    await paymentService.processMpesaCallback(
      {
        merchantRequestID:
          MerchantRequestID,
        checkoutRequestID:
          CheckoutRequestID,
        resultCode: ResultCode,
        resultDesc: ResultDesc,
        callbackMetadata,
      }
    );

    // ----------------------------------------------------------
    // SYNC CONTRACT AFTER PAYMENT SERVICE PROCESSES PAYMENT
    // ----------------------------------------------------------

    const transaction =
      await Transaction.findOne({
        "mpesa.checkoutRequestID":
          CheckoutRequestID,
      });

    if (transaction) {
      const contract =
        await Contract.findOne({
          transaction:
            transaction._id,
        }).populate(
          "job",
          "title"
        );

      if (contract) {
        if (
          transaction.status ===
          "completed"
        ) {
          contract.paymentStatus =
            "paid";

          await contract.save();

          await createNotification(
            contract.client,
            `Payment for "${contract.job.title}" was received successfully.`
          );

          await createNotification(
            contract.developer,
            `Payment for "${contract.job.title}" has been received and placed into escrow.`
          );
        }

        if (
          transaction.status ===
          "failed"
        ) {
          contract.paymentStatus =
            "unpaid";

          await contract.save();

          await createNotification(
            contract.client,
            `Payment for "${contract.job.title}" failed. Please try again.`
          );
        }
      }
    }

    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  } catch (error) {
    /*
     * Safaricom should still receive a successful
     * acknowledgement so it does not endlessly retry
     * the callback.
     */
    console.error(
      "Contract callback error:",
      error
    );

    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  }
};

// ============================================================
// 8. RELEASE PAYMENT
// ============================================================
// NOTE:
// Actual escrow release should eventually live entirely inside
// escrowService. This controller only validates the request.
// ============================================================

export const releasePayment = async (
  req,
  res
) => {
  try {
    const {
      contractId,
    } = req.params;

    const {
      amount,
      milestoneId,
    } = req.body;

    const contract =
      await Contract.findById(
        contractId
      )
        .populate(
          "job",
          "title escrowAmount releasedAmount paymentStatus budget"
        )
        .populate(
          "client",
          "username email"
        )
        .populate(
          "developer",
          "username email"
        );

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: "Contract not found",
      });
    }

    const isClient =
      contract.client._id.toString() ===
      req.user.id.toString();

    const isAdmin =
      req.user.role === "admin";

    if (!isClient && !isAdmin) {
      return res.status(403).json({
        success: false,
        message:
          "Only the client or admin can release payment",
      });
    }

    if (contract.status !== "active") {
      return res.status(400).json({
        success: false,
        message:
          "Contract must be active to release payment",
      });
    }

    if (
      contract.paymentStatus !==
      "paid"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Contract payment must be completed before releasing funds",
      });
    }

    if (!contract.job) {
      return res.status(404).json({
        success: false,
        message: "Associated job not found",
      });
    }

    const releaseAmount =
      Number(amount) ||
      contract.developerAmount;

    if (
      !Number.isFinite(
        releaseAmount
      ) ||
      releaseAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Release amount must be greater than zero",
      });
    }

    if (
      releaseAmount >
      contract.job.escrowAmount
    ) {
      return res.status(400).json({
        success: false,
        message: `Amount exceeds escrow balance. Available: ${contract.job.escrowAmount}`,
      });
    }

    // ----------------------------------------------------------
    // MILESTONE VALIDATION
    // ----------------------------------------------------------

    let milestone = null;

    if (milestoneId) {
      milestone =
        contract.job.milestones?.id(
          milestoneId
        ) ||
        contract.milestones?.id(
          milestoneId
        );

      if (
        contract.milestones?.length &&
        !contract.milestones.id(
          milestoneId
        )
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Milestone not found",
        });
      }
    }

    // ----------------------------------------------------------
    // CREATE RELEASE TRANSACTION
    // ----------------------------------------------------------

    const releaseTransaction =
      await Transaction.create({
        type: "milestone_release",

        job: contract.job._id,

        client:
          contract.client._id,

        developer:
          contract.developer._id,

        milestone:
          milestoneId || null,

        amount:
          releaseAmount,

        platformFee: 0,

        developerAmount:
          releaseAmount,

        totalAmount:
          releaseAmount,

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

        description:
          `Payment release for ${contract.job.title}`,

        metadata: {
          source:
            "contract_payment_release",

          contractId:
            contract._id.toString(),
        },
      });

    // ----------------------------------------------------------
    // UPDATE JOB ESCROW
    // ----------------------------------------------------------

    const job =
      await Job.findById(
        contract.job._id
      );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    job.escrowAmount = Math.max(
      0,
      (job.escrowAmount || 0) -
        releaseAmount
    );

    job.releasedAmount =
      (job.releasedAmount || 0) +
      releaseAmount;

    if (
      job.escrowAmount <= 0
    ) {
      job.paymentStatus =
        "paid";
    } else {
      job.paymentStatus =
        "partially_released";
    }

    await job.save();

    // ----------------------------------------------------------
    // UPDATE CONTRACT
    // ----------------------------------------------------------

    if (milestoneId) {
      const contractMilestone =
        contract.milestones?.id(
          milestoneId
        );

      if (contractMilestone) {
        contractMilestone.status =
          "released";

        contractMilestone.releasedAt =
          new Date();
      }
    }

    contract.releasedAt =
      new Date();

    contract.releasedBy =
      req.user.id;

    if (
      job.escrowAmount <= 0
    ) {
      contract.paymentStatus =
        "released";
    }

    await contract.save();

    // ----------------------------------------------------------
    // NOTIFY DEVELOPER
    // ----------------------------------------------------------

    await createNotification(
      contract.developer._id,
      `Payment of ${releaseAmount} has been released for "${contract.job.title}".`
    );

    return res.status(200).json({
      success: true,
      message:
        "Payment released successfully",

      releaseTransaction: {
        id:
          releaseTransaction._id,

        transactionId:
          releaseTransaction.transactionId,

        amount:
          releaseTransaction.amount,

        status:
          releaseTransaction.status,
      },

      releaseAmount,

      remainingEscrow:
        job.escrowAmount,

      contractPaymentStatus:
        contract.paymentStatus,

      jobPaymentStatus:
        job.paymentStatus,
    });
  } catch (error) {
    console.error(
      "Release payment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to release payment",
    });
  }
};
