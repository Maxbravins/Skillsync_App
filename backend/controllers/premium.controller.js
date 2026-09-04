import User from "../models/user.model.js";
import Transaction from "../models/transaction.model.js";

import { initiateSTKPush } from "../services/mpesa.service.js";

import {
  getPremiumPlan,
  calculatePremiumExpiry,
} from "../services/premium.service.js";


// ============================================================
// INITIATE PREMIUM SUBSCRIPTION PAYMENT
// ============================================================

export const payPremium = async (req, res) => {
  try {
    const { plan, phoneNumber } = req.body;

    // ----------------------------------------------------------
    // Validate request
    // ----------------------------------------------------------

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Premium plan is required.",
      });
    }

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required.",
      });
    }

    // ----------------------------------------------------------
    // Validate Premium plan
    // ----------------------------------------------------------

    const selectedPlan = getPremiumPlan(plan);

    if (!selectedPlan) {
      return res.status(400).json({
        success: false,
        message: "Invalid Premium plan.",
      });
    }

    // ----------------------------------------------------------
    // Find logged-in user
    // ----------------------------------------------------------

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // ----------------------------------------------------------
    // Prevent duplicate active subscription
    // ----------------------------------------------------------

    if (
      user.isPremium &&
      user.premiumExpiresAt &&
      new Date(user.premiumExpiresAt) > new Date()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You already have an active Premium subscription.",
        premiumPlan: user.premiumPlan,
        premiumExpiresAt: user.premiumExpiresAt,
      });
    }

    // ----------------------------------------------------------
    // Prevent duplicate pending Premium payments
    // ----------------------------------------------------------

    const userQuery =
      user.role === "client"
        ? { client: user._id }
        : { developer: user._id };

    const existingPendingTransaction =
      await Transaction.findOne({
        ...userQuery,

        type: "premium_subscription",

        status: {
          $in: ["pending", "processing"],
        },

        "metadata.premiumPlan": plan,
      });

    if (existingPendingTransaction) {
      return res.status(400).json({
        success: false,
        message:
          "You already have a pending Premium payment. Complete it before starting another payment.",

        transactionId:
          existingPendingTransaction._id,
      });
    }

    // ----------------------------------------------------------
    // Premium amount
    // ----------------------------------------------------------

    const amount = Number(selectedPlan.price);

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid Premium plan price.",
      });
    }

    // ----------------------------------------------------------
    // Initiate M-Pesa STK Push
    // ----------------------------------------------------------

    let stkResponse;

    try {
      stkResponse = await initiateSTKPush({
        phoneNumber,
        amount,

        accountReference:
          `PREMIUM-${user._id}`,

        transactionDesc:
          `SkillSync ${selectedPlan.name}`,

        callbackUrl:
          `${process.env.BACKEND_URL}/api/premium-payment/callback`,
      });
    } catch (error) {
      console.error(
        "Premium STK Push error:",
        error
      );

      return res.status(502).json({
        success: false,
        message:
          error.message ||
          "M-Pesa could not initiate the Premium payment.",
      });
    }

    // ----------------------------------------------------------
    // Validate STK response
    // ----------------------------------------------------------

    if (
      !stkResponse ||
      !stkResponse.CheckoutRequestID
    ) {
      return res.status(502).json({
        success: false,
        message:
          "M-Pesa did not return a valid CheckoutRequestID.",
      });
    }

    // ----------------------------------------------------------
    // Create Premium transaction
    // ----------------------------------------------------------

    const transactionData = {
      type: "premium_subscription",

      paymentType:
        "premium_subscription",

      client:
        user.role === "client"
          ? user._id
          : null,

      developer:
        user.role === "developer"
          ? user._id
          : null,

      job: null,
      application: null,
      contract: null,
      milestone: null,

      amount,

      projectAmount: 0,

      platformFee: 0,

      developerAmount: 0,

      totalAmount: amount,

      currency: "KES",

      paymentMethod: "mpesa",

      status: "pending",

      mpesa: {
        phoneNumber,

        merchantRequestID:
          stkResponse.MerchantRequestID || "",

        checkoutRequestID:
          stkResponse.CheckoutRequestID || "",
      },

      description:
        `SkillSync ${selectedPlan.name}`,

      metadata: {
        premiumPlan: plan,

        premiumPlanName:
          selectedPlan.name,

        userId: user._id.toString(),
      },
    };

    const transaction =
      await Transaction.create(
        transactionData
      );

    // ----------------------------------------------------------
    // Response
    // ----------------------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        `${selectedPlan.name} payment initiated. Please enter your M-Pesa PIN.`,

      transaction: {
        _id: transaction._id,

        transactionId:
          transaction.transactionId,

        amount:
          transaction.amount,

        plan,

        planName:
          selectedPlan.name,

        status:
          transaction.status,

        checkoutRequestID:
          transaction.mpesa
            ?.checkoutRequestID,
      },
    });

  } catch (error) {
    console.error(
      "Premium payment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Premium payment initiation failed.",
    });
  }
};


// ============================================================
// M-PESA PREMIUM CALLBACK
// ============================================================

export const premiumCallback = async (
  req,
  res
) => {
  try {
    console.log(
      "========== M-PESA PREMIUM CALLBACK =========="
    );

    const callback =
      req.body?.Body?.stkCallback;

    // ----------------------------------------------------------
    // Validate callback
    // ----------------------------------------------------------

    if (!callback) {
      console.warn(
        "Invalid Premium M-Pesa callback received."
      );

      return res.json({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });
    }

    const {
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = callback;

    // ----------------------------------------------------------
    // Find Premium transaction
    // ----------------------------------------------------------

    const transaction =
      await Transaction.findOne({
        "mpesa.checkoutRequestID":
          CheckoutRequestID,

        type: "premium_subscription",
      });

    if (!transaction) {
      console.warn(
        `Premium transaction not found for CheckoutRequestID: ${CheckoutRequestID}`
      );

      return res.json({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });
    }

    // ----------------------------------------------------------
    // Prevent duplicate callback processing
    // ----------------------------------------------------------

    if (
      transaction.status ===
      "completed"
    ) {
      console.log(
        `Premium transaction ${transaction._id} was already completed.`
      );

      return res.json({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });
    }

    // ----------------------------------------------------------
    // Save M-Pesa result
    // ----------------------------------------------------------

    transaction.mpesa.resultCode =
      ResultCode;

    transaction.mpesa.resultDesc =
      ResultDesc || "";

    // ==========================================================
    // PAYMENT SUCCESSFUL
    // ==========================================================

    if (ResultCode === 0) {
      const metadata =
        CallbackMetadata?.Item || [];

      // --------------------------------------------------------
      // Extract receipt number
      // --------------------------------------------------------

      const receiptItem =
        metadata.find(
          (item) =>
            item.Name ===
            "MpesaReceiptNumber"
        );

      if (receiptItem?.Value) {
        transaction.mpesa
          .mpesaReceiptNumber =
          receiptItem.Value;
      }

      // --------------------------------------------------------
      // Mark transaction completed
      // --------------------------------------------------------

      transaction.status =
        "completed";

      transaction.paidAt =
        new Date();

      transaction.completedAt =
        new Date();

      await transaction.save();

      // --------------------------------------------------------
      // Determine Premium user
      // --------------------------------------------------------

      const userId =
        transaction.client ||
        transaction.developer;

      if (!userId) {
        console.error(
          `Premium transaction ${transaction._id} has no client/developer reference.`
        );

        return res.json({
          ResultCode: 0,
          ResultDesc: "Accepted",
        });
      }

      const user =
        await User.findById(userId);

      if (!user) {
        console.error(
          `Premium transaction ${transaction._id} completed, but user ${userId} was not found.`
        );

        return res.json({
          ResultCode: 0,
          ResultDesc: "Accepted",
        });
      }

      // --------------------------------------------------------
      // Validate Premium plan
      // --------------------------------------------------------

      const plan =
        transaction.metadata
          ?.premiumPlan;

      if (
        !plan ||
        ![
          "monthly",
          "yearly",
        ].includes(plan)
      ) {
        console.error(
          `Premium transaction ${transaction._id} has an invalid plan: ${plan}`
        );

        // Transaction is completed but cannot
        // safely activate Premium.
        transaction.status =
          "review_required";

        transaction.review = {
          required: true,

          reason:
            `Invalid Premium plan: ${plan}`,

          createdAt:
            new Date(),

          resolvedAt: null,

          resolvedBy: null,
        };

        await transaction.save();

        return res.json({
          ResultCode: 0,
          ResultDesc: "Accepted",
        });
      }

      // --------------------------------------------------------
      // Calculate Premium dates
      // --------------------------------------------------------

      const startedAt =
        new Date();

      const expiresAt =
        calculatePremiumExpiry(
          plan,
          startedAt
        );

      // --------------------------------------------------------
      // Activate Premium
      // --------------------------------------------------------

      user.isPremium = true;

      user.premiumPlan =
        plan;

      user.premiumStartedAt =
        startedAt;

      user.premiumExpiresAt =
        expiresAt;

      await user.save();

      // --------------------------------------------------------
      // Log success
      // --------------------------------------------------------

      console.log(
        "========================================"
      );

      console.log(
        "PREMIUM PAYMENT SUCCESSFUL"
      );

      console.log(
        `User: ${user.username}`
      );

      console.log(
        `Email: ${user.email}`
      );

      console.log(
        `Plan: ${plan}`
      );

      console.log(
        `Amount: KES ${transaction.amount}`
      );

      console.log(
        `Receipt: ${transaction.mpesa.mpesaReceiptNumber}`
      );

      console.log(
        `Expires: ${expiresAt.toISOString()}`
      );

      console.log(
        "========================================"
      );
    }

    // ==========================================================
    // PAYMENT FAILED / CANCELLED
    // ==========================================================

    else {
      transaction.status =
        "failed";

      await transaction.save();

      console.log(
        `Premium payment failed: ${ResultDesc}`
      );
    }

    // ----------------------------------------------------------
    // Always acknowledge Safaricom callback
    // ----------------------------------------------------------

    return res.json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });

  } catch (error) {
    console.error(
      "Premium callback error:",
      error
    );

    // Always acknowledge M-Pesa
    // callback to prevent unnecessary retries.

    return res.json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  }
};
