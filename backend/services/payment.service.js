import mongoose from "mongoose";
import Job from "../models/job.model.js";
import Transaction from "../models/transaction.model.js";
import {
  formatPhoneNumber,
  initiateSTKPush,
  initiateB2CPayment,
} from "../services/mpesa.service.js";
import escrowService from "../services/escrow.service.js";

class PaymentService {
  // ============================================================
  // CREATE JOB PAYMENT
  // ============================================================

  async createJobPayment({
    jobId,
    clientId,
    paymentMethod = "mpesa",
    phoneNumber = null,
  }) {
    const job = await Job.findById(jobId);

    if (!job) {
      throw new Error("Job not found");
    }

    if (
      job.client.toString() !==
      clientId.toString()
    ) {
      throw new Error(
        "You are not authorized to pay for this job"
      );
    }

    if (
      ![
        "Open",
        "Filled",
        "In Progress",
      ].includes(job.status)
    ) {
      throw new Error(
        `Cannot pay for a job with status "${job.status}"`
      );
    }

    if (job.paymentStatus === "paid") {
      throw new Error(
        "This job has already been fully paid"
      );
    }

    if (paymentMethod === "mpesa") {
      if (!phoneNumber) {
        throw new Error(
          "Phone number is required for M-Pesa payment"
        );
      }

      phoneNumber =
        formatPhoneNumber(phoneNumber);
    }

    /*
     * Prevent multiple active payment attempts
     * for the same job.
     */
    const existingTransaction =
      await Transaction.findOne({
        job: job._id,
        client: clientId,
        type: "project_payment",
        status: {
          $in: [
            "pending",
            "processing",
          ],
        },
      }).sort({ createdAt: -1 });

    if (existingTransaction) {
      return existingTransaction;
    }

    const transaction =
      await Transaction.create({
        type: "project_payment",

        client: clientId,

        developer:
          job.hiredDeveloper || null,

        job: job._id,

        amount: job.budget,

        platformFee:
          job.platformFeeAmount,

        developerAmount:
          job.budget,

        totalAmount:
          job.clientTotalAmount,

        currency: job.currency,

        status: "pending",

        escrowStatus: null,

        paymentMethod,

        mpesa:
          paymentMethod === "mpesa"
            ? {
                phoneNumber,
              }
            : undefined,

        description:
          `Payment for job: ${job.title}`,

        metadata: {
          source: "job_payment",
        },
      });

    return transaction;
  }

  // ============================================================
  // INITIATE JOB PAYMENT
  // ============================================================

  async initiateJobPayment({
    jobId,
    clientId,
    phoneNumber,
  }) {
    const transaction =
      await this.createJobPayment({
        jobId,
        clientId,
        paymentMethod: "mpesa",
        phoneNumber,
      });

    /*
     * Already processing means an STK Push
     * has already been sent.
     */
    if (
      transaction.status === "processing"
    ) {
      return {
        transaction,
        alreadyInitiated: true,
      };
    }

    /*
     * Already completed should normally not happen
     * here, but protects against race conditions.
     */
    if (
      transaction.status === "completed"
    ) {
      return {
        transaction,
        alreadyCompleted: true,
      };
    }

    const job =
      await Job.findById(jobId);

    if (!job) {
      throw new Error("Job not found");
    }

    transaction.status =
      "processing";

    await transaction.save();

    try {
      const response =
        await initiateSTKPush({
          phoneNumber:
            transaction.mpesa.phoneNumber,

          amount:
            transaction.totalAmount,

          accountReference:
            transaction.transactionId,

          transactionDesc:
            `Payment for ${job.title}`,
        });

      /*
       * Safaricom STK response normally includes:
       *
       * MerchantRequestID
       * CheckoutRequestID
       * ResponseCode
       * ResponseDescription
       * CustomerMessage
       */

      transaction.mpesa.merchantRequestID =
        response.MerchantRequestID || "";

      transaction.mpesa.checkoutRequestID =
        response.CheckoutRequestID || "";

      transaction.paymentProviderData = {
        provider: "mpesa",

        response,
      };

      await transaction.save();

      return {
        transaction,
        providerResponse: response,
      };
    } catch (error) {
      transaction.status =
        "failed";

      transaction.mpesa.resultDesc =
        error.message ||
        "M-Pesa STK Push failed";

      await transaction.save();

      throw error;
    }
  }

  // ============================================================
  // PROCESS M-PESA STK CALLBACK
  // ============================================================

  async processMpesaCallback({
    merchantRequestID,
    checkoutRequestID,
    resultCode,
    resultDesc,
    callbackMetadata = {},
  }) {
    if (!checkoutRequestID) {
      throw new Error(
        "Missing CheckoutRequestID"
      );
    }

    /*
     * Find the transaction using the
     * unique M-Pesa CheckoutRequestID.
     */
    const transaction =
      await Transaction.findOne({
        "mpesa.checkoutRequestID":
          checkoutRequestID,
      });

    if (!transaction) {
      throw new Error(
        `Transaction not found for CheckoutRequestID: ${checkoutRequestID}`
      );
    }

    /*
     * Idempotency.
     *
     * Safaricom may retry callbacks.
     */
    if (
      transaction.status === "completed"
    ) {
      return {
        transaction,
        alreadyProcessed: true,
      };
    }

    /*
     * Save provider response.
     */
    transaction.mpesa.merchantRequestID =
      merchantRequestID ||
      transaction.mpesa
        .merchantRequestID;

    transaction.mpesa.resultCode =
      resultCode ?? null;

    transaction.mpesa.resultDesc =
      resultDesc || "";

    /*
     * Extract useful callback metadata.
     */
    const receiptNumber =
      callbackMetadata
        .MpesaReceiptNumber || "";

    const phoneNumber =
      callbackMetadata
        .PhoneNumber || "";

    if (phoneNumber) {
      transaction.mpesa.phoneNumber =
        phoneNumber;
    }

    /*
     * Payment failed.
     */
    if (Number(resultCode) !== 0) {
      transaction.status =
        "failed";

      await transaction.save();

      return {
        transaction,
        success: false,
        alreadyProcessed: false,
      };
    }

    /*
     * Successful M-Pesa payment.
     */
    transaction.mpesa
      .mpesaReceiptNumber =
      receiptNumber;

    transaction.status =
      "completed";

    transaction.completedAt =
      new Date();

    transaction.paidAt =
      new Date();

    transaction.paymentProviderData = {
      ...transaction.paymentProviderData,

      callback: callbackMetadata,
    };

    await transaction.save();

    /*
     * Fund escrow after successful payment.
     */
    const escrowResult =
      await escrowService.fundEscrow({
        transactionId:
          transaction._id,
      });

    return {
      transaction,
      escrow: escrowResult,
      success: true,
      alreadyProcessed: false,
    };
  }

  // ============================================================
  // INITIATE WITHDRAWAL
  // ============================================================

  async initiateWithdrawal({
    developerId,
    phoneNumber,
    amount,
    currency = "KES",
  }) {
    if (currency !== "KES") {
      throw new Error(
        "M-Pesa withdrawals currently support KES only"
      );
    }

    if (!amount || amount <= 0) {
      throw new Error(
        "Withdrawal amount must be greater than zero"
      );
    }

    const formattedPhone =
      formatPhoneNumber(phoneNumber);

    /*
     * Withdrawal transaction.
     *
     * Balance validation should eventually happen
     * through a wallet/balance service.
     */
    const transaction =
      await Transaction.create({
        type: "withdrawal",

        developer: developerId,

        amount,

        platformFee: 0,

        developerAmount: amount,

        totalAmount: amount,

        currency,

        status: "processing",

        paymentMethod: "mpesa",

        mpesa: {
          phoneNumber:
            formattedPhone,
        },

        description:
          "Developer withdrawal",

        metadata: {
          source:
            "developer_withdrawal",
        },
      });

    try {
      const response =
        await initiateB2CPayment({
          phoneNumber:
            formattedPhone,

          amount,

          remarks:
            "SkillSync Withdrawal",

          occasion:
            transaction.transactionId,
        });

      transaction.paymentProviderData = {
        provider: "mpesa",

        response,
      };

      await transaction.save();

      return {
        transaction,
        providerResponse: response,
      };
    } catch (error) {
      transaction.status =
        "failed";

      transaction.mpesa.resultDesc =
        error.message ||
        "M-Pesa withdrawal failed";

      await transaction.save();

      throw error;
    }
  }

  // ============================================================
  // REFUND
  // ============================================================

  async refundPayment({
    transactionId,
    reason = "Payment refunded",
  }) {
    return escrowService.refundEscrow({
      transactionId,
      reason,
    });
  }
}

export default new PaymentService();
