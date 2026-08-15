import User from "../models/user.model.js";
import Transaction from "../models/transaction.model.js";
import { initiateSTKPush } from "../services/mpesa.service.js";
import {
  getPremiumPlan,
  calculatePremiumExpiry,
} from "../services/premium.service.js";

export const payPremium = async (req, res) => {
  try {
    const { plan } = req.body;
    const { phoneNumber } = req.body;

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

    const selectedPlan = getPremiumPlan(plan);

    if (!selectedPlan) {
      return res.status(400).json({
        success: false,
        message: "Invalid premium plan.",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Prevent duplicate active subscriptions
    if (
      user.isPremium &&
      user.premiumExpiresAt &&
      new Date(user.premiumExpiresAt) > new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "You already have an active Premium subscription.",
        premiumExpiresAt: user.premiumExpiresAt,
      });
    }

    const amount = selectedPlan.price;

    const stkResponse = await initiateSTKPush({
      phoneNumber,
      amount,
      accountReference: `PREMIUM-${user._id}`,
      transactionDesc: `SkillSync ${selectedPlan.name}`,
    });

    const transaction = await Transaction.create({
      job: null,
      client: user.role === "client" ? user._id : user._id,
      developer: user.role === "developer" ? user._id : null,

      application: null,
      contract: null,

      amount,
      projectAmount: 0,
      platformFee: 0,
      totalAmount: amount,

      phoneNumber,

      paymentType: "premium",
      status: "pending",

      merchantRequestID: stkResponse.MerchantRequestID || "",
      checkoutRequestID: stkResponse.CheckoutRequestID || "",
    });

    res.status(200).json({
      success: true,
      message: `${selectedPlan.name} payment initiated.`,
      transaction: {
        _id: transaction._id,
        amount: transaction.amount,
        plan,
        planName: selectedPlan.name,
        status: transaction.status,
        checkoutRequestID: transaction.checkoutRequestID,
      },
    });
  } catch (error) {
    console.error("Premium payment error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const premiumCallback = async (req, res) => {
  try {
    const callback = req.body.Body?.stkCallback;

    if (!callback) {
      return res.json({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });
    }

    const transaction = await Transaction.findOne({
      checkoutRequestID: callback.CheckoutRequestID,
      paymentType: "premium",
    });

    if (!transaction) {
      return res.json({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });
    }

    transaction.resultCode = callback.ResultCode;
    transaction.resultDesc = callback.ResultDesc;

    if (callback.ResultCode === 0) {
      transaction.status = "completed";
      transaction.paidAt = new Date();

      // Extract M-Pesa receipt
      const metadata = callback.CallbackMetadata?.Item || [];

      const receiptItem = metadata.find(
        (item) => item.Name === "MpesaReceiptNumber"
      );

      if (receiptItem?.Value) {
        transaction.mpesaReceiptNumber = receiptItem.Value;
      }

      await transaction.save();

      // Find the Premium subscriber
      let user = null;

      if (transaction.developer) {
        user = await User.findById(transaction.developer);
      } else if (transaction.client) {
        user = await User.findById(transaction.client);
      }

      if (!user) {
        console.error(
          "Premium payment completed but user could not be found."
        );

        return res.json({
          ResultCode: 0,
          ResultDesc: "Accepted",
        });
      }

      /*
       * Determine the plan from the amount.
       *
       * KES 300  -> monthly
       * KES 3000 -> yearly
       */
      let plan = null;

      if (transaction.amount === 300) {
        plan = "monthly";
      } else if (transaction.amount === 3000) {
        plan = "yearly";
      }

      if (!plan) {
        console.error(
          `Unknown Premium amount: ${transaction.amount}`
        );

        return res.json({
          ResultCode: 0,
          ResultDesc: "Accepted",
        });
      }

      const startedAt = new Date();

      const expiresAt = calculatePremiumExpiry(
        plan,
        startedAt
      );

      user.isPremium = true;
      user.premiumPlan = plan;
      user.premiumStartedAt = startedAt;
      user.premiumExpiresAt = expiresAt;

      await user.save();

      console.log(
        `Premium activated for ${user.email}. Plan: ${plan}. Expires: ${expiresAt.toISOString()}`
      );
    } else {
      transaction.status = "failed";

      await transaction.save();

      console.log(
        `Premium payment failed: ${callback.ResultDesc}`
      );
    }

    return res.json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  } catch (error) {
    console.error("Premium callback error:", error);

    /*
     * Always acknowledge the callback so M-Pesa
     * does not repeatedly retry the request.
     */
    return res.json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  }
};