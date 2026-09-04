// backend/controllers/withdrawal.controller.js

import Wallet from "../models/wallet.model.js";
import Withdrawal from "../models/withdrawal.model.js";
import Notification from "../models/notification.model.js";
import Transaction from "../models/transaction.model.js";

import {
  sendWithdrawalApprovedEmail,
  sendWithdrawalRejectedEmail,
} from "../services/email.service.js";

import { initiateB2CPayment } from "../services/mpesa.service.js";

const MIN_WITHDRAWAL = 500;
const DAILY_LIMIT = 100000;

// ============================================
// 1. REQUEST WITHDRAWAL
// ============================================

export const requestWithdrawal = async (req, res) => {
  try {
    const { amount, phoneNumber } = req.body;

    // Only developers can withdraw
    if (req.user.role !== "developer") {
      return res.status(403).json({
        success: false,
        message: "Only developers can request withdrawals.",
      });
    }

    const withdrawalAmount = Number(amount);

    if (!withdrawalAmount || withdrawalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid withdrawal amount.",
      });
    }

    if (withdrawalAmount < MIN_WITHDRAWAL) {
      return res.status(400).json({
        success: false,
        message: `Minimum withdrawal amount is ${MIN_WITHDRAWAL}.`,
      });
    }

    if (!phoneNumber?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required.",
      });
    }

    const wallet = await Wallet.findOne({
      developer: req.user.id,
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    if (withdrawalAmount > wallet.availableBalance) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ${wallet.availableBalance}`,
      });
    }

    // ============================================
    // DAILY WITHDRAWAL LIMIT
    // ============================================

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyWithdrawals = await Withdrawal.aggregate([
      {
        $match: {
          developer: req.user.id,
          status: {
            $in: [
              "pending",
              "approved",
              "paid",
              "completed",
            ],
          },
          createdAt: {
            $gte: today,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$amount",
          },
        },
      },
    ]);

    const dailyTotal =
      dailyWithdrawals[0]?.total || 0;

    const remainingDailyLimit =
      DAILY_LIMIT - dailyTotal;

    if (
      dailyTotal + withdrawalAmount >
      DAILY_LIMIT
    ) {
      return res.status(400).json({
        success: false,
        message: `Daily withdrawal limit exceeded. Remaining: ${Math.max(
          0,
          remainingDailyLimit
        )}`,
      });
    }

    // ============================================
    // PREVENT MULTIPLE PENDING WITHDRAWALS
    // ============================================

    const existingWithdrawal =
      await Withdrawal.findOne({
        developer: req.user.id,
        status: "pending",
      });

    if (existingWithdrawal) {
      return res.status(400).json({
        success: false,
        message:
          "You already have a pending withdrawal request.",
      });
    }

    // ============================================
    // CREATE WITHDRAWAL
    // ============================================

    const withdrawal =
      await Withdrawal.create({
        developer: req.user.id,
        wallet: wallet._id,
        amount: withdrawalAmount,
        phoneNumber: phoneNumber.trim(),
        status: "pending",
      });

    // ============================================
    // RESERVE WALLET FUNDS
    // ============================================

    wallet.availableBalance -= withdrawalAmount;

    wallet.pendingWithdrawal =
      (wallet.pendingWithdrawal || 0) +
      withdrawalAmount;

    await wallet.save();

    return res.status(201).json({
      success: true,
      message: "Withdrawal request submitted.",
      withdrawal,
    });
  } catch (error) {
    console.error(
      "Withdrawal request error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to request withdrawal.",
    });
  }
};

// ============================================
// 2. GET MY WITHDRAWALS
// ============================================

export const getMyWithdrawals = async (
  req,
  res
) => {
  try {
    const page = Math.max(
      Number(req.query.page) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number(req.query.limit) || 20,
        1
      ),
      100
    );

    const skip =
      (page - 1) * limit;

    const [
      withdrawals,
      total,
    ] = await Promise.all([
      Withdrawal.find({
        developer: req.user.id,
      })
        .populate("wallet")
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      Withdrawal.countDocuments({
        developer: req.user.id,
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: withdrawals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(
          total / limit
        ),
      },
    });
  } catch (error) {
    console.error(
      "Get withdrawals error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to retrieve withdrawals.",
    });
  }
};

// ============================================
// 3. ADMIN: APPROVE WITHDRAWAL
// ============================================

export const approveWithdrawal = async (
  req,
  res
) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Only admins can approve withdrawals.",
      });
    }

    const withdrawal =
      await Withdrawal.findById(
        req.params.id
      )
        .populate(
          "developer",
          "username email"
        )
        .populate("wallet");

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal not found.",
      });
    }

    if (
      withdrawal.status !== "pending"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Withdrawal already processed.",
      });
    }

    // ============================================
    // UPDATE WITHDRAWAL
    // ============================================

    withdrawal.status = "approved";
    withdrawal.processedBy =
      req.user.id;
    withdrawal.processedAt =
      new Date();

    await withdrawal.save();

    // ============================================
    // CREATE TRANSACTION
    // ============================================

    const transaction =
      await Transaction.create({
        type: "withdrawal",

        client: null,

        developer:
          withdrawal.developer._id,

        job: null,

        application: null,

        contract: null,

        milestone: null,

        amount:
          withdrawal.amount,

        platformFee: 0,

        developerAmount:
          withdrawal.amount,

        totalAmount:
          withdrawal.amount,

        currency: "KES",

        status: "pending",

        paymentMethod: "mpesa",

        mpesa: {
          phoneNumber:
            withdrawal.phoneNumber,
        },

        description:
          `Withdrawal approved: ${withdrawal._id}`,

        metadata: {
          withdrawalId:
            withdrawal._id.toString(),

          approvedBy:
            req.user.id.toString(),
        },
      });

    // ============================================
    // NOTIFICATION
    // ============================================

    await Notification.create({
      recipient:
        withdrawal.developer._id,

      type: "withdrawal_success",

      title: "Withdrawal Approved",

      message:
        `Your withdrawal request of KES ${withdrawal.amount} has been approved. We'll send the payment shortly.`,

      priority: "normal",

      isRead: false,

      data: {
        withdrawalId:
          withdrawal._id,

        transactionId:
          transaction._id,

        amount:
          withdrawal.amount,
      },
    });

    // ============================================
    // EMAIL
    // ============================================

    if (withdrawal.developer.email) {
      await sendWithdrawalApprovedEmail({
        email:
          withdrawal.developer.email,

        developerName:
          withdrawal.developer.username,

        amount:
          withdrawal.amount,
      });
    }

    return res.json({
      success: true,
      message:
        "Withdrawal approved successfully.",

      withdrawal,

      transaction,
    });
  } catch (error) {
    console.error(
      "Approve withdrawal error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to approve withdrawal.",
    });
  }
};

// ============================================
// 4. ADMIN: REJECT WITHDRAWAL
// ============================================

export const rejectWithdrawal = async (
  req,
  res
) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Only admins can reject withdrawals.",
      });
    }

    const withdrawal =
      await Withdrawal.findById(
        req.params.id
      )
        .populate("wallet")
        .populate(
          "developer",
          "username email"
        );

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message:
          "Withdrawal not found.",
      });
    }

    if (
      withdrawal.status !== "pending"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Withdrawal already processed.",
      });
    }

    withdrawal.status = "rejected";

    withdrawal.processedBy =
      req.user.id;

    withdrawal.processedAt =
      new Date();

    withdrawal.rejectionReason =
      req.body.reason ||
      "No reason provided";

    await withdrawal.save();

    // ============================================
    // RETURN FUNDS TO WALLET
    // ============================================

    const wallet =
      await Wallet.findById(
        withdrawal.wallet._id
      );

    if (wallet) {
      wallet.availableBalance +=
        withdrawal.amount;

      wallet.pendingWithdrawal =
        Math.max(
          0,
          (wallet.pendingWithdrawal || 0) -
            withdrawal.amount
        );

      await wallet.save();
    }

    // ============================================
    // NOTIFICATION
    // ============================================

    await Notification.create({
      recipient:
        withdrawal.developer._id,

      type: "withdrawal_failed",

      title: "Withdrawal Rejected",

      message:
        `Your withdrawal request of KES ${withdrawal.amount} has been rejected. Reason: ${withdrawal.rejectionReason}`,

      priority: "high",

      isRead: false,

      data: {
        withdrawalId:
          withdrawal._id,

        amount:
          withdrawal.amount,

        reason:
          withdrawal.rejectionReason,
      },
    });

    // ============================================
    // EMAIL
    // ============================================

    if (withdrawal.developer.email) {
      await sendWithdrawalRejectedEmail({
        email:
          withdrawal.developer.email,

        developerName:
          withdrawal.developer.username,

        amount:
          withdrawal.amount,

        reason:
          withdrawal.rejectionReason,
      });
    }

    return res.json({
      success: true,
      message: "Withdrawal rejected.",
      withdrawal,
    });
  } catch (error) {
    console.error(
      "Reject withdrawal error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to reject withdrawal.",
    });
  }
};

// ============================================
// 5. ADMIN: SEND B2C PAYMENT
// ============================================

export const sendWithdrawalPayment = async (
  req,
  res
) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Only admins can send withdrawal payments.",
      });
    }

    const withdrawal =
      await Withdrawal.findById(
        req.params.id
      )
        .populate("developer")
        .populate("wallet");

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message:
          "Withdrawal not found.",
      });
    }

    if (
      withdrawal.status !== "approved"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only approved withdrawals can be paid.",
      });
    }

    // ============================================
    // FIND TRANSACTION
    // ============================================

    const transaction =
      await Transaction.findOne({
        type: "withdrawal",

        "metadata.withdrawalId":
          withdrawal._id.toString(),
      });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message:
          "Withdrawal transaction not found.",
      });
    }

    // Prevent duplicate B2C initiation
    if (
      transaction.status === "processing" ||
      withdrawal.status === "paid"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Withdrawal payment has already been initiated.",
      });
    }

    // ============================================
    // MARK TRANSACTION PROCESSING
    // ============================================

    transaction.status =
      "processing";

    await transaction.save();

    // ============================================
    // INITIATE B2C PAYMENT
    // ============================================

    let b2cResponse;

    try {
      b2cResponse =
        await initiateB2CPayment({
          phoneNumber:
            withdrawal.phoneNumber,

          amount:
            withdrawal.amount,

          remarks:
            `Withdrawal ${withdrawal._id}`,

          occasion:
            "SkillSync Withdrawal",
        });
    } catch (error) {
      transaction.status =
        "failed";

      transaction.mpesa.resultDesc =
        error.message ||
        "B2C payment initiation failed.";

      await transaction.save();

      throw error;
    }

    if (
      !b2cResponse?.ConversationID
    ) {
      transaction.status =
        "review_required";

      transaction.review = {
        required: true,
        reason:
          "M-Pesa B2C did not return a ConversationID.",
        createdAt: new Date(),
        resolvedAt: null,
        resolvedBy: null,
      };

      await transaction.save();

      return res.status(502).json({
        success: false,
        message:
          "M-Pesa did not return a valid ConversationID.",
      });
    }

    // ============================================
    // UPDATE TRANSACTION M-PESA DATA
    // ============================================

    transaction.mpesa.merchantRequestID =
      b2cResponse.OriginatorConversationID ||
      "";

    transaction.mpesa.checkoutRequestID =
      b2cResponse.ConversationID;

    transaction.mpesa.phoneNumber =
      withdrawal.phoneNumber;

    transaction.metadata = {
      ...(transaction.metadata || {}),
      withdrawalId:
        withdrawal._id.toString(),

      conversationID:
        b2cResponse.ConversationID,

      originatorConversationID:
        b2cResponse.OriginatorConversationID ||
        "",
    };

    await transaction.save();

    // ============================================
    // UPDATE WITHDRAWAL
    // ============================================

    withdrawal.status = "paid";

    withdrawal.mpesaConversationID =
      b2cResponse.ConversationID;

    withdrawal.mpesaOriginatorConversationID =
      b2cResponse.OriginatorConversationID;

    withdrawal.mpesaInitiatedAt =
      new Date();

    await withdrawal.save();

    return res.json({
      success: true,

      message:
        "B2C payment initiated successfully.",

      mpesa: {
        conversationID:
          b2cResponse.ConversationID,

        originatorConversationID:
          b2cResponse.OriginatorConversationID,
      },

      transaction: {
        _id:
          transaction._id,

        transactionId:
          transaction.transactionId,

        status:
          transaction.status,
      },
    });
  } catch (error) {
    console.error(
      "Send withdrawal payment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to initiate withdrawal payment.",
    });
  }
};

// ============================================
// 6. B2C RESULT CALLBACK
// ============================================

export const b2cResultCallback = async (
  req,
  res
) => {
  try {
    console.log(
      "B2C Result Callback:",
      JSON.stringify(
        req.body,
        null,
        2
      )
    );

    const result =
      req.body?.Result;

    if (!result) {
      console.log(
        "No Result in B2C callback"
      );

      return res.status(200).json({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });
    }

    const {
      ResultCode,
      ResultDesc,
      ConversationID,
      OriginatorConversationID,
      TransactionID,
    } = result;

    // ============================================
    // FIND WITHDRAWAL
    // ============================================

    const withdrawal =
      await Withdrawal.findOne({
        mpesaConversationID:
          ConversationID,
      }).populate("wallet");

    if (!withdrawal) {
      console.log(
        `Withdrawal not found for ConversationID: ${ConversationID}`
      );

      return res.status(200).json({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });
    }

    // ============================================
    // IDEMPOTENCY
    // ============================================

    if (
      withdrawal.status === "completed" ||
      withdrawal.status === "failed"
    ) {
      console.log(
        `Withdrawal ${withdrawal._id} already processed.`
      );

      return res.status(200).json({
        ResultCode: 0,
        ResultDesc: "Already processed",
      });
    }

    withdrawal.mpesaResultCode =
      ResultCode;

    withdrawal.mpesaResultDesc =
      ResultDesc;

    // ============================================
    // FIND RELATED TRANSACTION
    // ============================================

    const transaction =
      await Transaction.findOne({
        type: "withdrawal",

        "metadata.withdrawalId":
          withdrawal._id.toString(),
      });

    // ============================================
    // SUCCESS
    // ============================================

    if (ResultCode === 0) {
      withdrawal.status =
        "completed";

      withdrawal.mpesaCompletedAt =
        new Date();

      // ============================================
      // UPDATE WALLET
      // ============================================

      if (withdrawal.wallet) {
        withdrawal.wallet.totalWithdrawn =
          (withdrawal.wallet.totalWithdrawn || 0) +
          withdrawal.amount;

        withdrawal.wallet.pendingWithdrawal =
          Math.max(
            0,
            (withdrawal.wallet.pendingWithdrawal || 0) -
              withdrawal.amount
          );

        await withdrawal.wallet.save();
      }

      // ============================================
      // UPDATE TRANSACTION
      // ============================================

      if (transaction) {
        transaction.status =
          "completed";

        transaction.completedAt =
          new Date();

        transaction.paidAt =
          new Date();

        transaction.withdrawnAt =
          new Date();

        transaction.mpesa.resultCode =
          ResultCode;

        transaction.mpesa.resultDesc =
          ResultDesc || "";

        if (TransactionID) {
          transaction.mpesa.mpesaReceiptNumber =
            TransactionID;
        }

        await transaction.save();
      }

      // ============================================
      // NOTIFICATION
      // ============================================

      await Notification.create({
        recipient:
          withdrawal.developer,

        type:
          "withdrawal_success",

        title:
          "Withdrawal Completed",

        message:
          `Your withdrawal of KES ${withdrawal.amount} has been sent to your M-Pesa.`,

        priority:
          "normal",

        isRead:
          false,

        data: {
          withdrawalId:
            withdrawal._id,

          transactionId:
            transaction?._id || null,

          amount:
            withdrawal.amount,

          mpesaReceiptNumber:
            TransactionID || null,
        },
      });
    }

    // ============================================
    // FAILURE
    // ============================================

    else {
      withdrawal.status =
        "failed";

      // Return reserved funds
      if (withdrawal.wallet) {
        withdrawal.wallet.availableBalance +=
          withdrawal.amount;

        withdrawal.wallet.pendingWithdrawal =
          Math.max(
            0,
            (withdrawal.wallet.pendingWithdrawal || 0) -
              withdrawal.amount
          );

        await withdrawal.wallet.save();
      }

      // ============================================
      // UPDATE TRANSACTION
      // ============================================

      if (transaction) {
        transaction.status =
          "failed";

        transaction.mpesa.resultCode =
          ResultCode;

        transaction.mpesa.resultDesc =
          ResultDesc ||
          "Withdrawal payment failed.";

        transaction.metadata = {
          ...(transaction.metadata || {}),

          failureReason:
            ResultDesc ||
            "Withdrawal payment failed.",
        };

        await transaction.save();
      }

      // ============================================
      // NOTIFICATION
      // ============================================

      await Notification.create({
        recipient:
          withdrawal.developer,

        type:
          "withdrawal_failed",

        title:
          "Withdrawal Failed",

        message:
          `Your withdrawal of KES ${withdrawal.amount} failed. Please try again or contact support.`,

        priority:
          "high",

        isRead:
          false,

        data: {
          withdrawalId:
            withdrawal._id,

          transactionId:
            transaction?._id || null,

          amount:
            withdrawal.amount,

          reason:
            ResultDesc ||
            "Withdrawal payment failed.",
        },
      });
    }

    await withdrawal.save();

    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  } catch (error) {
    console.error(
      "B2C Callback Error:",
      error
    );

    // Always acknowledge M-Pesa
    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  }
};

// ============================================
// 7. B2C TIMEOUT CALLBACK
// ============================================

export const b2cTimeoutCallback = async (
  req,
  res
) => {
  try {
    console.log(
      "B2C Timeout:",
      JSON.stringify(
        req.body,
        null,
        2
      )
    );

    /*
     * Do not immediately mark the withdrawal as
     * failed on timeout. Safaricom may still process
     * the transaction.
     *
     * The transaction remains "processing" until
     * the final B2C result callback is received.
     */

    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  } catch (error) {
    console.error(
      "B2C timeout callback error:",
      error
    );

    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  }
};
