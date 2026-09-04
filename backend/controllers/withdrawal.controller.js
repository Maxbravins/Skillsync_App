// backend/controllers/withdrawal.controller.js
import Wallet from "../models/wallet.model.js";
import Withdrawal from "../models/withdrawal.model.js";
import Notification from "../models/notification.model.js"; // ← FIXED IMPORT
import Transaction from "../models/transaction.model.js"; // ← Added
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

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid withdrawal amount.",
      });
    }

    if (amount < MIN_WITHDRAWAL) {
      return res.status(400).json({
        success: false,
        message: `Minimum withdrawal amount is ${MIN_WITHDRAWAL}`,
      });
    }

    if (!phoneNumber) {
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

    if (amount > wallet.availableBalance) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ${wallet.availableBalance}`,
      });
    }

    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyWithdrawals = await Withdrawal.aggregate([
      {
        $match: {
          developer: req.user.id,
          status: { $in: ["pending", "approved", "paid", "completed"] },
          createdAt: { $gte: today },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const dailyTotal = dailyWithdrawals[0]?.total || 0;
    if (dailyTotal + amount > DAILY_LIMIT) {
      return res.status(400).json({
        success: false,
        message: `Daily withdrawal limit exceeded. Remaining: ${DAILY_LIMIT - dailyTotal}`,
      });
    }

    const existingWithdrawal = await Withdrawal.findOne({
      developer: req.user.id,
      status: "pending",
    });

    if (existingWithdrawal) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending withdrawal request.",
      });
    }

    // Create withdrawal
    const withdrawal = await Withdrawal.create({
      developer: req.user.id,
      wallet: wallet._id,
      amount,
      phoneNumber,
      status: "pending",
    });

    // Deduct from available and track pending
    wallet.availableBalance -= amount;
    wallet.pendingWithdrawal = (wallet.pendingWithdrawal || 0) + amount; // ← ADD THIS
    await wallet.save();

    res.status(201).json({
      success: true,
      message: "Withdrawal request submitted.",
      withdrawal,
    });
  } catch (error) {
    console.error("Withdrawal request error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// 2. GET MY WITHDRAWALS (with pagination)
// ============================================
export const getMyWithdrawals = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [withdrawals, total] = await Promise.all([
      Withdrawal.find({ developer: req.user.id })
        .populate("wallet")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Withdrawal.countDocuments({ developer: req.user.id }),
    ]);

    res.status(200).json({
      success: true,
      data: withdrawals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// 3. ADMIN: APPROVE WITHDRAWAL
// ============================================
export const approveWithdrawal = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can approve withdrawals.",
      });
    }

    const withdrawal = await Withdrawal.findById(req.params.id)
      .populate("developer")
      .populate("wallet");

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal not found.",
      });
    }

    if (withdrawal.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Withdrawal already processed.",
      });
    }

    withdrawal.status = "approved";
    withdrawal.processedBy = req.user.id;
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    // Create transaction record
    await Transaction.create({
      transactionId: `WTH-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type: "withdrawal",
      user: withdrawal.developer._id,
      developer: withdrawal.developer._id,
      amount: withdrawal.amount,
      totalAmount: withdrawal.amount,
      developerAmount: withdrawal.amount,
      paymentMethod: "mpesa",
      status: "pending", // Will be completed when B2C succeeds
      description: `Withdrawal approved: ${withdrawal._id}`,
      metadata: {
        withdrawalId: withdrawal._id,
        approvedBy: req.user.id,
      },
    });

    await Notification.create({
      user: withdrawal.developer._id,
      title: "Withdrawal Approved",
      message: `Your withdrawal request of ${withdrawal.amount} has been approved. We'll send the payment shortly.`,
    });

    await sendWithdrawalApprovedEmail({
      email: withdrawal.developer.email,
      developerName: withdrawal.developer.username,
      amount: withdrawal.amount,
    });

    res.json({
      success: true,
      message: "Withdrawal approved successfully.",
      withdrawal,
    });
  } catch (error) {
    console.error("Approve withdrawal error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// 4. ADMIN: REJECT WITHDRAWAL
// ============================================
export const rejectWithdrawal = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can reject withdrawals.",
      });
    }

    const withdrawal = await Withdrawal.findById(req.params.id)
      .populate("wallet")
      .populate("developer", "username email");

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal not found.",
      });
    }

    if (withdrawal.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Withdrawal already processed.",
      });
    }

    withdrawal.status = "rejected";
    withdrawal.processedBy = req.user.id;
    withdrawal.processedAt = new Date();
    withdrawal.rejectionReason = req.body.reason || "No reason provided";
    await withdrawal.save();

    // Return the money to the wallet
    const wallet = await Wallet.findById(withdrawal.wallet._id);
    if (wallet) {
      wallet.availableBalance += withdrawal.amount;
      wallet.pendingWithdrawal = Math.max(0, (wallet.pendingWithdrawal || 0) - withdrawal.amount);
      await wallet.save();
    }

    await Notification.create({
      user: withdrawal.developer._id,
      title: "Withdrawal Rejected",
      message: `Your withdrawal request of ${withdrawal.amount} has been rejected. Reason: ${withdrawal.rejectionReason}`,
    });

    await sendWithdrawalRejectedEmail({
      email: withdrawal.developer.email,
      developerName: withdrawal.developer.username,
      amount: withdrawal.amount,
      reason: withdrawal.rejectionReason,
    });

    res.json({
      success: true,
      message: "Withdrawal rejected.",
      withdrawal,
    });
  } catch (error) {
    console.error("Reject withdrawal error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// 5. ADMIN: SEND B2C PAYMENT
// ============================================
export const sendWithdrawalPayment = async (req, res) => {
  try {
    // 🔴 ADDED: Admin check
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can send withdrawal payments.",
      });
    }

    const withdrawal = await Withdrawal.findById(req.params.id)
      .populate("developer")
      .populate("wallet");

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal not found.",
      });
    }

    if (withdrawal.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Only approved withdrawals can be paid.",
      });
    }

    // Check platform wallet balance
    // You need to have a platform wallet in your system
    // const platformWallet = await Wallet.findOne({ role: "platform" });
    // if (!platformWallet || platformWallet.availableBalance < withdrawal.amount) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Platform insufficient funds. Please contact support.",
    //   });
    // }

    // Initiate B2C payment
    const b2cResponse = await initiateB2CPayment({
      phoneNumber: withdrawal.phoneNumber,
      amount: withdrawal.amount,
      remarks: `Withdrawal ${withdrawal._id}`,
      occasion: "SkillSync Withdrawal",
    });

    // Update withdrawal with M-Pesa tracking
    withdrawal.status = "paid";
    withdrawal.mpesaConversationID = b2cResponse.ConversationID;
    withdrawal.mpesaOriginatorConversationID = b2cResponse.OriginatorConversationID;
    withdrawal.mpesaInitiatedAt = new Date();
    await withdrawal.save();

    // Update wallet totalWithdrawn (will be finalized in callback)
    // Wait for B2C callback to confirm before updating

    res.json({
      success: true,
      message: "B2C payment initiated successfully.",
      mpesa: {
        conversationID: b2cResponse.ConversationID,
        originatorConversationID: b2cResponse.OriginatorConversationID,
      },
    });
  } catch (error) {
    console.error("Send withdrawal payment error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

  //  B2C RESULT CALLBACK (PROCESSED)
export const b2cResultCallback = async (req, res) => {
  try {
    console.log("B2C Result Callback:", JSON.stringify(req.body, null, 2));

    const result = req.body?.Result;
    if (!result) {
      console.log("No Result in B2C callback");
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const { ResultCode, ResultDesc, ConversationID, OriginatorConversationID } = result;

    // Find withdrawal by ConversationID
    const withdrawal = await Withdrawal.findOne({
      mpesaConversationID: ConversationID,
    }).populate("wallet");

    if (!withdrawal) {
      console.log(`Withdrawal not found for ConversationID: ${ConversationID}`);
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // Process the callback result
    withdrawal.mpesaResultCode = ResultCode;
    withdrawal.mpesaResultDesc = ResultDesc;

    if (ResultCode === 0) {
      // Success
      withdrawal.status = "completed";
      withdrawal.mpesaCompletedAt = new Date();

      // Update wallet totalWithdrawn
      if (withdrawal.wallet) {
        withdrawal.wallet.totalWithdrawn = (withdrawal.wallet.totalWithdrawn || 0) + withdrawal.amount;
        withdrawal.wallet.pendingWithdrawal = Math.max(0, (withdrawal.wallet.pendingWithdrawal || 0) - withdrawal.amount);
        await withdrawal.wallet.save();
      }

      // Update related transaction
      await Transaction.findOneAndUpdate(
        { "metadata.withdrawalId": withdrawal._id },
        {
          status: "completed",
          paidAt: new Date(),
          mpesa: {
            mpesaReceiptNumber: result.TransactionID,
          },
        }
      );

      await Notification.create({
        user: withdrawal.developer,
        title: "Withdrawal Completed",
        message: `Your withdrawal of ${withdrawal.amount} has been sent to your M-Pesa.`,
      });

    } else {
      // Failure - Return money to wallet
      withdrawal.status = "failed";

      if (withdrawal.wallet) {
        withdrawal.wallet.availableBalance += withdrawal.amount;
        withdrawal.wallet.pendingWithdrawal = Math.max(0, (withdrawal.wallet.pendingWithdrawal || 0) - withdrawal.amount);
        await withdrawal.wallet.save();
      }

      // Update related transaction
      await Transaction.findOneAndUpdate(
        { "metadata.withdrawalId": withdrawal._id },
        {
          status: "failed",
          metadata: {
            ...withdrawal.metadata,
            failureReason: ResultDesc,
          },
        }
      );

      await Notification.create({
        user: withdrawal.developer,
        title: "Withdrawal Failed",
        message: `Your withdrawal of ${withdrawal.amount} failed. Please try again or contact support.`,
      });
    }

    await withdrawal.save();

    return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    console.error("B2C Callback Error:", error);
    return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
};

// ============================================
// 7. B2C TIMEOUT CALLBACK
// ============================================
export const b2cTimeoutCallback = async (req, res) => {
  console.log("B2C Timeout:", JSON.stringify(req.body, null, 2));

  // Handle timeout - usually means payment might still go through
  return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
};