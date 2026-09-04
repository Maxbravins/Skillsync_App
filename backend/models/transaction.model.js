import crypto from "crypto";
import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    // ============================================================
    // TRANSACTION REFERENCE
    // ============================================================

    transactionId: {
      type: String,
      unique: true,
      immutable: true,
      index: true,
      default: () => `TXN-${crypto.randomUUID()}`,
    },

    // ============================================================
    // TRANSACTION TYPE
    // ============================================================

    type: {
      type: String,
      enum: [
        "project_payment",
        "milestone_release",
        "withdrawal",
        "platform_fee",
        "premium_subscription",
        "refund",
        "deposit",
      ],
      required: true,
      index: true,
    },

    // Backward-compatible alias used by the current
    // platform payment controller.
    //
    // Your controller currently sends:
    //
    // paymentType: "platform_fee"
    //
    // We normalize it into `type` before validation.
    paymentType: {
      type: String,
      enum: [
        "project_payment",
        "milestone_release",
        "withdrawal",
        "platform_fee",
        "premium_subscription",
        "refund",
        "deposit",
      ],
      default: null,
      index: true,
    },

    // ============================================================
    // USERS / ENTITIES
    // ============================================================

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      default: null,
      index: true,
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

    milestone: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // ============================================================
    // AMOUNTS
    // ============================================================

    // Base transaction/project/milestone amount.
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    // Project amount used by the existing payment controller.
    projectAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Platform fee.
    platformFee: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Amount ultimately belonging to developer.
    developerAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Total amount actually charged/moved.
    totalAmount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    // ============================================================
    // CURRENCY
    // ============================================================

    currency: {
      type: String,
      enum: ["USD", "KES", "EUR"],
      default: "KES",
      uppercase: true,
      trim: true,
    },

    // ============================================================
    // STATUS
    // ============================================================

    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
        "review_required",
        "refunded",
      ],
      default: "pending",
      index: true,
    },

    // ============================================================
    // ESCROW
    // ============================================================

    escrowStatus: {
      type: String,
      enum: [
        "held",
        "released",
        "refunded",
      ],
      default: null,
      index: true,
    },

    releasedAt: {
      type: Date,
      default: null,
    },

    // ============================================================
    // PAYMENT METHOD
    // ============================================================

    paymentMethod: {
      type: String,
      enum: [
        "mpesa",
        "credit_card",
        "paypal",
        "wallet",
        "bank_transfer",
      ],
      default: "mpesa",
    },

    // ============================================================
    // PAYMENT PROVIDER DATA
    // ============================================================

    paymentProviderData: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },

    // ============================================================
    // M-PESA
    //
    // Structured fields are used by the callback.
    // ============================================================

    mpesa: {
      merchantRequestID: {
        type: String,
        trim: true,
        default: "",
      },

      checkoutRequestID: {
        type: String,
        trim: true,
        default: "",
      },

      mpesaReceiptNumber: {
        type: String,
        trim: true,
        default: "",
      },

      resultCode: {
        type: Number,
        default: null,
      },

      resultDesc: {
        type: String,
        trim: true,
        default: "",
      },

      phoneNumber: {
        type: String,
        trim: true,
        default: "",
      },
    },

    // ============================================================
    // REVIEW / RECONCILIATION
    // ============================================================

    review: {
      required: {
        type: Boolean,
        default: false,
      },

      reason: {
        type: String,
        trim: true,
        default: "",
      },

      createdAt: {
        type: Date,
        default: null,
      },

      resolvedAt: {
        type: Date,
        default: null,
      },

      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },

    // ============================================================
    // DESCRIPTION / METADATA
    // ============================================================

    description: {
      type: String,
      trim: true,
      default: "",
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },

    // ============================================================
    // TIMESTAMPS
    // ============================================================

    completedAt: {
      type: Date,
      default: null,
    },

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

// ============================================================
// NORMALIZE PAYMENT TYPE
// ============================================================
//
// Supports both:
//
// type: "platform_fee"
//
// and the existing controller:
//
// paymentType: "platform_fee"
// ============================================================

transactionSchema.pre("validate", function (next) {
  if (!this.type && this.paymentType) {
    this.type = this.paymentType;
  }

  if (!this.paymentType && this.type) {
    this.paymentType = this.type;
  }

  // ------------------------------------------------------------
  // Monetary rounding
  // ------------------------------------------------------------

  if (this.amount !== undefined) {
    this.amount =
      Math.round(this.amount * 100) / 100;
  }

  if (this.projectAmount !== undefined) {
    this.projectAmount =
      Math.round(this.projectAmount * 100) / 100;
  }

  if (this.platformFee !== undefined) {
    this.platformFee =
      Math.round(this.platformFee * 100) / 100;
  }

  if (this.developerAmount !== undefined) {
    this.developerAmount =
      Math.round(this.developerAmount * 100) / 100;
  }

  if (this.totalAmount !== undefined) {
    this.totalAmount =
      Math.round(this.totalAmount * 100) / 100;
  }

  // ------------------------------------------------------------
  // Keep projectAmount synchronized where appropriate.
  // ------------------------------------------------------------

  if (
    this.projectAmount === 0 &&
    this.type === "project_payment"
  ) {
    this.projectAmount = this.amount;
  }

  // ------------------------------------------------------------
  // Financial validation
  // ------------------------------------------------------------

  if (
    this.type === "project_payment" ||
    this.type === "deposit"
  ) {
    const expectedTotal =
      Math.round(
        (this.amount + this.platformFee) * 100
      ) / 100;

    if (
      this.totalAmount !== expectedTotal
    ) {
      return next(
        new Error(
          `Invalid transaction totals. Expected totalAmount ${expectedTotal}, got ${this.totalAmount}`
        )
      );
    }
  }

  // Platform fee transactions charge the fee itself.
  if (this.type === "platform_fee") {
    if (
      this.platformFee > 0 &&
      this.totalAmount !== this.platformFee
    ) {
      return next(
        new Error(
          "For platform_fee transactions, totalAmount must equal platformFee"
        )
      );
    }
  }

  if (
    this.developerAmount >
    this.amount
  ) {
    return next(
      new Error(
        "developerAmount cannot exceed amount"
      )
    );
  }

  next();
});

// ============================================================
// INDEXES
// ============================================================

transactionSchema.index({
  client: 1,
  createdAt: -1,
});

transactionSchema.index({
  developer: 1,
  createdAt: -1,
});

transactionSchema.index({
  job: 1,
  createdAt: -1,
});

transactionSchema.index({
  job: 1,
  type: 1,
  status: 1,
  createdAt: -1,
});

transactionSchema.index({
  status: 1,
  createdAt: -1,
});

transactionSchema.index({
  paymentType: 1,
  status: 1,
  createdAt: -1,
});

// ============================================================
// M-PESA LOOKUPS
// ============================================================

transactionSchema.index({
  "mpesa.checkoutRequestID": 1,
});

transactionSchema.index({
  "mpesa.mpesaReceiptNumber": 1,
});

transactionSchema.index(
  {
    "mpesa.checkoutRequestID": 1,
  },
  {
    unique: true,
    sparse: true,
    name: "unique_mpesa_checkout_request",
  }
);

transactionSchema.index(
  {
    "mpesa.mpesaReceiptNumber": 1,
  },
  {
    unique: true,
    sparse: true,
    name: "unique_mpesa_receipt",
  }
);

// ============================================================
// METHODS
// ============================================================

// Mark transaction as processing.
transactionSchema.methods.markProcessing =
  async function () {
    if (
      [
        "completed",
        "failed",
        "cancelled",
        "refunded",
      ].includes(this.status)
    ) {
      throw new Error(
        `Cannot process transaction with status "${this.status}"`
      );
    }

    this.status = "processing";

    return this.save();
  };

// ============================================================
// MARK COMPLETED
// ============================================================

transactionSchema.methods.markCompleted =
  async function (
    receiptNumber = null
  ) {
    if (this.status === "completed") {
      return this;
    }

    if (
      [
        "failed",
        "cancelled",
        "refunded",
      ].includes(this.status)
    ) {
      throw new Error(
        `Cannot complete a transaction with status "${this.status}"`
      );
    }

    this.status = "completed";

    this.completedAt = new Date();

    this.paidAt = new Date();

    if (receiptNumber) {
      this.mpesa.mpesaReceiptNumber =
        receiptNumber;
    }

    return this.save();
  };

// ============================================================
// HOLD IN ESCROW
// ============================================================

transactionSchema.methods.holdInEscrow =
  async function () {
    if (this.status !== "completed") {
      throw new Error(
        "Only completed transactions can be placed in escrow"
      );
    }

    if (this.escrowStatus) {
      throw new Error(
        `Transaction already has escrow status "${this.escrowStatus}"`
      );
    }

    this.escrowStatus = "held";

    return this.save();
  };

// ============================================================
// RELEASE ESCROW
// ============================================================

transactionSchema.methods.releaseEscrow =
  async function () {
    if (
      this.escrowStatus !== "held"
    ) {
      throw new Error(
        "Only funds currently held in escrow can be released"
      );
    }

    this.escrowStatus = "released";

    this.releasedAt = new Date();

    return this.save();
  };

// ============================================================
// REFUND
// ============================================================

transactionSchema.methods.markRefunded =
  async function () {
    if (
      [
        "failed",
        "cancelled",
      ].includes(this.status)
    ) {
      throw new Error(
        "Cannot refund a failed or cancelled transaction"
      );
    }

    if (this.status === "refunded") {
      return this;
    }

    this.status = "refunded";

    this.escrowStatus = "refunded";

    this.refundedAt = new Date();

    return this.save();
  };

// ============================================================
// FAILED
// ============================================================

transactionSchema.methods.markFailed =
  async function (
    reason = "Payment failed"
  ) {
    if (this.status === "completed") {
      throw new Error(
        "Cannot fail a completed transaction"
      );
    }

    if (this.status === "refunded") {
      throw new Error(
        "Cannot fail a refunded transaction"
      );
    }

    this.status = "failed";

    this.mpesa.resultDesc =
      reason;

    return this.save();
  };

// ============================================================
// REVIEW
// ============================================================

transactionSchema.methods.markForReview =
  async function (
    reason =
      "Transaction requires manual review"
  ) {
    this.status =
      "review_required";

    this.review = {
      required: true,
      reason,
      createdAt: new Date(),
      resolvedAt: null,
      resolvedBy: null,
    };

    return this.save();
  };

// ============================================================
// RESOLVE REVIEW
// ============================================================

transactionSchema.methods.resolveReview =
  async function (userId) {
    if (!this.review.required) {
      throw new Error(
        "Transaction does not require review"
      );
    }

    this.review.required = false;

    this.review.resolvedAt =
      new Date();

    this.review.resolvedBy =
      userId;

    return this.save();
  };

export default mongoose.model(
  "Transaction",
  transactionSchema
);
