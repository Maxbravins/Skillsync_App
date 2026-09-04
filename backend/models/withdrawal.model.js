import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "paid", "completed", "failed"],
      default: "pending",
      index: true,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    // M-Pesa B2C tracking
    mpesaConversationID: { type: String, default: "" },
    mpesaOriginatorConversationID: { type: String, default: "" },
    mpesaResultCode: { type: Number, default: null },
    mpesaResultDesc: { type: String, default: "" },
    mpesaInitiatedAt: { type: Date, default: null },
    mpesaCompletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes
withdrawalSchema.index({ developer: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1, createdAt: -1 });
withdrawalSchema.index({ mpesaConversationID: 1 });

export default mongoose.model("Withdrawal", withdrawalSchema);