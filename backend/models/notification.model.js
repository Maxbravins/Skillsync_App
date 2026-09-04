import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // ============================================================
    // RECIPIENT
    // ============================================================

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ============================================================
    // NOTIFICATION TYPE
    // ============================================================

    type: {
      type: String,
      enum: [
        // Job
        "job_application",
        "application_accepted",
        "application_rejected",

        // Milestones
        "milestone_completed",
        "milestone_approved",
        "milestone_released",

        // Payments
        "payment_success",
        "payment_failed",

        // Escrow
        "escrow_funded",
        "escrow_released",
        "escrow_refunded",

        // Withdrawals
        "withdrawal_success",
        "withdrawal_failed",

        // Premium
        "premium_activated",
        "premium_expiring",

        // System
        "system",
      ],
      required: true,
      index: true,
    },

    // ============================================================
    // DISPLAY
    // ============================================================

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    // ============================================================
    // PRIORITY
    // ============================================================

    priority: {
      type: String,
      enum: [
        "low",
        "normal",
        "high",
        "urgent",
      ],
      default: "normal",
      index: true,
    },

    // ============================================================
    // READ STATUS
    // ============================================================

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },

    // ============================================================
    // RELATED DATA
    //
    // Examples:
    //
    // {
    //   jobId,
    //   transactionId,
    //   milestoneId,
    //   applicationId
    // }
    // ============================================================

    data: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },

    // ============================================================
    // EXPIRATION
    // ============================================================

    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// INDEXES
// ============================================================

// User's newest notifications first
notificationSchema.index({
  recipient: 1,
  createdAt: -1,
});

// Quickly retrieve unread notifications
notificationSchema.index({
  recipient: 1,
  isRead: 1,
  createdAt: -1,
});

// Useful for notification filtering
notificationSchema.index({
  recipient: 1,
  type: 1,
  createdAt: -1,
});

// Automatically remove expired notifications
notificationSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    sparse: true,
  }
);

export default mongoose.model(
  "Notification",
  notificationSchema
);
