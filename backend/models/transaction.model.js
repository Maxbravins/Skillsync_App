import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Application",
    default: null,
  },

  contract: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Contract",
  default: null,
  },

    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      default: null,
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    amount: {
      type: Number,
      required: true,
    },
    
    commission: {
    type: Number,
    default: 0,
  },

    developerAmount: {
    type: Number,
    default: 0,
  },


    // Original project amount
      projectAmount: {
        type: Number,
        required: true,
      },

      // SkillSync commission (10%)
      platformFee: {
        type: Number,
        required: true,
      },

      // Total amount client pays
      totalAmount: {
        type: Number,
        required: true,
      },

    phoneNumber: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "completed",
        "failed",
        "cancelled",
      ],
      default: "pending",
    },

    released: {
    type: Boolean,
    default: false,
  },

  releasedAt: {
    type: Date,
    default: null,
  },

    merchantRequestID: {
      type: String,
      default: "",
    },

    checkoutRequestID: {
      type: String,
      default: "",
    },

    mpesaReceiptNumber: {
      type: String,
      default: "",
    },

    paymentType: {
    type: String,
    enum: [
        "platform_fee",
        "project_payment",
        "withdrawal",
        "premium"
      ],
      required: true,
      },

    resultCode: {
      type: Number,
      default: null,
    },

    resultDesc: {
      type: String,
      default: "",
    },

    paidAt: {
      type: Date,
      default: null,
    },

    withdrawnAt: {
    type: Date,
    default: null,
  },
  },
  {
    timestamps: true,
  }
);

const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);

export default Transaction;