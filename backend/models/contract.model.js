import mongoose from "mongoose";

const contractSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },

    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    commission: {
      type: Number,
      required: true,
    },

    developerAmount: {
      type: Number,
      required: true,
    },

    // Client payment status
        paymentStatus: {
        type: String,
        enum: [
            "unpaid",
            "pending",
            "paid",
            "released",
        ],
        default: "unpaid",
        },

        // Linked payment transaction
        transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
        default: null,
        },

    status: {
      type: String,
      enum: [
        "pending",
        "active",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },

    clientSigned: {
      type: Boolean,
      default: true,
    },

    developerSigned: {
      type: Boolean,
      default: false,
    },

    startedAt: Date,

    completedAt: Date,

    releasedAt: {
        type: Date,
        },

        releasedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
        },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Contract", contractSchema);