import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },

    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    coverLetter: {
      type: String,
      required: true,
      trim: true,
    },

    proposedBudget: {
      type: Number,
      required: true,
      min: 0,
    },

    proposedTimeline: {
      type: String,
      default: "",
      trim: true,
    },

    attachments: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: [
        "pending",
        "reviewed",
        "shortlisted",
        "accepted",
        "rejected",
        "withdrawn",
      ],
      default: "pending",
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "pending", "escrow", "paid"],
      default: "unpaid",
    },

    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      default: null,
    },

    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
    },

    rejectionReason: {
      type: String,
      default: "",
    },

    reviewedAt: { type: Date, default: null },
    acceptedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    withdrawnAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// A developer can only apply to a given job once -- enforced at the
applicationSchema.index(
  { job: 1, developer: 1 },
  { unique: true }
);

applicationSchema.index({ status: 1 });
applicationSchema.index({ developer: 1, createdAt: -1 });

const Application =
  mongoose.models.Application ||
  mongoose.model("Application", applicationSchema);

export default Application;