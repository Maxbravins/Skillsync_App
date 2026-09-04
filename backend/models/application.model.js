// backend/models/application.model.js
import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    coverLetter: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    proposedBudget: {
      type: Number,
      required: true,
      min: 1,
    },
    proposedTimeline: {
      type: String,
      default: "",
    },
    attachments: [{
      type: String, // URLs to uploaded files
    }],
    
    // === STATUSES ===
    status: {
      type: String,
      enum: ["pending", "reviewed", "shortlisted", "accepted", "rejected", "withdrawn"],
      default: "pending",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "pending", "escrow", "released", "refunded"],
      default: "unpaid",
      index: true,
    },

    // === REFERENCES ===
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
    },
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      default: null,
    },

    // === TIMESTAMPS ===
    reviewedAt: {
      type: Date,
      default: null,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    releasedAt: {
      type: Date,
      default: null,
    },

    // === CLIENT FEEDBACK ===
    clientFeedback: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// === INDEXES ===
applicationSchema.index({ job: 1, developer: 1 }, { unique: true });
applicationSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Application", applicationSchema);