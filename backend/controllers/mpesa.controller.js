import Transaction from "../models/transaction.model.js";
import Application from "../models/application.model.js";
import Job from "../models/job.model.js";
import { initiateSTKPush } from "../services/mpesa.service.js";

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

    const application = await Application.findById(applicationId).populate(
      "job"
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (application.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Only accepted applications can be paid for",
      });
    }

    const job = application.job;

    if (job.client.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to pay for this job",
      });
    }

    const existing = await Transaction.findOne({
      application: application._id,
      status: "completed",
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "This job has already been paid for",
      });
    }

    const stkResponse = await initiateSTKPush({
      phoneNumber,
      amount: job.budget,
      accountReference: `SkillSync-${job._id.toString().slice(-6)}`,
      transactionDesc: `Payment for ${job.title}`,
    });

    const transaction = await Transaction.create({
      application: application._id,
      job: job._id,
      client: req.user.id,
      developer: application.developer,
      amount: job.budget,
      phoneNumber,
      status: "pending",
      merchantRequestID: stkResponse.MerchantRequestID,
      checkoutRequestID: stkResponse.CheckoutRequestID,
    });

    res.status(200).json({
      success: true,
      message: "STK Push sent. Check your phone to complete payment.",
      transactionId: transaction._id,
      checkoutRequestID: stkResponse.CheckoutRequestID,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const mpesaCallback = async (req, res) => {
  try {
    const callback = req.body?.Body?.stkCallback;

    if (!callback) {
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } =
      callback;

    const transaction = await Transaction.findOne({
      checkoutRequestID: CheckoutRequestID,
    });

    if (!transaction) {
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    if (ResultCode === 0) {
      const items = CallbackMetadata?.Item || [];
      const receipt = items.find(
        (item) => item.Name === "MpesaReceiptNumber"
      );

      transaction.status = "completed";
      transaction.mpesaReceiptNumber = receipt?.Value || "";
      transaction.resultDesc = ResultDesc;
    } else {
      transaction.status = "failed";
      transaction.resultDesc = ResultDesc;
    }

    await transaction.save();

    res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    console.log(error);
    res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
};

export const getTransactionStatus = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    if (
      transaction.client.toString() !== req.user.id &&
      transaction.developer.toString() !== req.user.id &&
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