// backend/models/Transaction.js
import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    // === REFERENCE ===
    transactionId: {
      type: String,
      unique: true,
      default: () => `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      
    },

    // === TYPES ===
    type: {
      type: String,
      enum: [
        "project_payment",      // Client pays for project
        "milestone_release",    // Release milestone to developer
        "withdrawal",           // Developer withdraws
        "platform_fee",         // Platform takes fee
        "premium_subscription", // User buys premium
        "refund",               // Refund to client
        "deposit",              // Wallet top-up
      ],
      required: true,
     
    },

    // === ENTITIES ===
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      
    },
    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      
    },
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

    // === AMOUNTS ===
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    platformFee: {
      type: Number,
      default: 0,
    },
    developerAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },

    // === CURRENCY ===
    currency: {
      type: String,
      enum: ["USD", "KES", "EUR"],
      default: "USD",
    },

    // === STATUS ===
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "cancelled", "refunded"],
      default: "pending",
      
    },

    // === ESCROW ===
    escrowStatus: {
      type: String,
      enum: ["held", "released", "refunded"],
      default: "held",
    },
    releasedAt: {
      type: Date,
      default: null,
    },

    // === PAYMENT DETAILS ===
    paymentMethod: {
      type: String,
      enum: ["mpesa", "credit_card", "paypal", "wallet", "bank_transfer"],
      required: true,
    },
    paymentProviderData: {
      type: mongoose.Schema.Types.Mixed, // Store provider-specific data
      default: {},
    },

    // === M-PESA SPECIFIC ===
    mpesa: {
      merchantRequestID: { type: String, default: "" },
      checkoutRequestID: { type: String, default: "" },
      mpesaReceiptNumber: { type: String, default: "" },
      resultCode: { type: Number, default: null },
      resultDesc: { type: String, default: "" },
      phoneNumber: { type: String, default: "" },
    },

    // === METADATA ===
    description: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // === TIMESTAMPS ===
    paidAt: {
      type: Date,
      default: null,
    },
    withdrawnAt: {
      type: Date,
      default: null,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// === INDEXES ===
transactionSchema.index({ client: 1, createdAt: -1 });
transactionSchema.index({ developer: 1, createdAt: -1 });
transactionSchema.index({ job: 1 });
transactionSchema.index({ "mpesa.checkoutRequestID": 1 });

// === METHODS ===
transactionSchema.methods.markCompleted = function(receiptNumber) {
  this.status = "completed";
  this.paidAt = new Date();
  if (receiptNumber) {
    this.mpesa.mpesaReceiptNumber = receiptNumber;
  }
  return this.save();
};

transactionSchema.methods.markFailed = function(reason) {
  this.status = "failed";
  this.mpesa.resultDesc = reason;
  return this.save();
};

export default mongoose.model("Transaction", transactionSchema);