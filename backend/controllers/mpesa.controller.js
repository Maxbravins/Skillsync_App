import Application from "../models/application.model.js";
import Job from "../models/job.model.js";
import Notification from "../models/notification.model.js";
import Transaction from "../models/transaction.model.js";
import { initiateSTKPush } from "../services/mpesa.service.js";
import Contract from "../models/contract.model.js";
import Wallet from "../models/wallet.model.js";
import { calculateCommission } from "../services/platformFee.service.js";
import { sendPaymentConfirmationToClient, sendPaymentReceivedEmail } from "../services/email.service.js";

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

    if (application.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "This application has already been paid.",
      });
    }

    const job = application.job;

    if (job.client.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized.",
      });
    }

    const existingTransaction = await Transaction.findOne({
      application: application._id,
      status: {
        $in: ["pending", "completed"],
      },
    });

    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message: "A payment already exists for this application.",
      });
    }

    let stkResponse;

    try {
      stkResponse = await initiateSTKPush({
        phoneNumber,
        amount: job.budget,
        accountReference: `SkillSync-${job._id.toString().slice(-6)}`,
        transactionDesc: `Payment for ${job.title}`,
      });
    } catch (error) {
      return res.status(502).json({
        success: false,
        message:
          error.message || "M-Pesa could not initiate the payment request.",
      });
    }

    const transaction = await Transaction.create({
      application: application._id,
      job: job._id,
      client: req.user.id,
      developer: application.developer._id,
      amount: job.budget,
      phoneNumber,
      status: "pending",
      merchantRequestID: stkResponse.MerchantRequestID,
      checkoutRequestID: stkResponse.CheckoutRequestID,
    });

    application.transaction = transaction._id;
    application.paymentStatus = "pending";
    await application.save();

    res.status(200).json({
      success: true,
      message: "STK Push sent successfully.",
      transaction,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message || "Payment initiation failed.",
    });
  }
};

export const mpesaCallback = async (req, res) => {
  try {
    const callback = req.body?.Body?.stkCallback;

    if (!callback) {
      return res.status(200).json({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });
    }
    // Extract relevant data from the callback
    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } =
      callback;

    const transaction = await Transaction.findOne({
      checkoutRequestID: CheckoutRequestID,
    });

    if (!transaction) {
      return res.status(200).json({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });
    }

    transaction.resultCode = ResultCode;
    transaction.resultDesc = ResultDesc;

    if (ResultCode === 0) {
      const metadata = CallbackMetadata?.Item || [];

      const receipt = metadata.find(
        (item) => item.Name === "MpesaReceiptNumber",
      );

      transaction.status = "completed";
      transaction.mpesaReceiptNumber = receipt?.Value || "";
      transaction.paidAt = new Date();

      await transaction.save();

      const application = await Application.findById(transaction.application);

      if (application) {
        application.paymentStatus = "paid";
        application.paidAt = new Date();
        application.transaction = transaction._id;

        await application.save();
      }
      // Handle contract creation and wallet update
      const contract = await Contract.findOne({
      application: application._id,
    });

    if (contract) {
      contract.status = "active";
      contract.startedAt = new Date();
      await contract.save();

      const commission = calculateCommission(contract.amount);
      const developerAmount = contract.amount - commission;

      let wallet = await Wallet.findOne({
        developer: contract.developer,
      });

      if (!wallet) {
        wallet = await Wallet.create({
          developer: contract.developer,
        });
      }

      wallet.pendingBalance += developerAmount;
      wallet.totalEarned += developerAmount;

      await wallet.save();
    }

      const job = await Job.findById(transaction.job)
        .populate("client", "username email")
        .populate("developer", "username email");

      if (job) {
        await Notification.create({
          user: transaction.client,
          message: `Payment for "${job.title}" was completed successfully.`,
        });

        await Notification.create({
          user: transaction.developer,
          message: `You have received payment for "${job.title}".`,
        });

        // Send email notifications to both client and developer
        await sendPaymentConfirmationToClient({
        email: job.client.email,
        clientName: job.client.username,
        jobTitle: job.title,
        amount: transaction.amount,
        });

        await sendPaymentReceivedEmail({
        email: job.developer.email,
        developerName: job.developer.username,
        jobTitle: job.title,
        amount: transaction.amount,
      });
      }
    } else {
      transaction.status = "failed";
      await transaction.save();

      const application = await Application.findById(transaction.application);

      if (application) {
        application.paymentStatus = "unpaid";
        application.transaction = null;

        await application.save();
      }

      await Notification.create({
        user: transaction.client,
        message: `Payment failed. ${ResultDesc}`,
      });
    }

    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  } catch (error) {
    console.error(error);

    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  }
};
// Get single transaction
export const getTransactionStatus = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("job", "title budget")
      .populate("client", "username email")
      .populate("developer", "username email");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    if (
      transaction.client._id.toString() !== req.user.id &&
      transaction.developer._id.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    res.status(200).json({
      success: true,
      transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get payment history
export const getMyTransactions = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "client") {
      filter.client = req.user.id;
    } else if (req.user.role === "developer") {
      filter.developer = req.user.id;
    }

    const transactions = await Transaction.find(filter)
      .populate("job", "title budget")
      .populate("client", "username")
      .populate("developer", "username")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
