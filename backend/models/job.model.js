import mongoose from "mongoose";

const milestoneSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "in_progress",
        "completed",
        "approved",
        "disputed",
        "released",
        "refunded",
      ],
      default: "pending",
      index: true,
    },

    dueDate: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    releasedAt: {
      type: Date,
      default: null,
    },

    refundedAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: true,
  }
);

const jobSchema = new mongoose.Schema(
  {
    // ============================================================
    // BASIC INFORMATION
    // ============================================================

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    // ============================================================
    // SKILLS
    // ============================================================

    requiredSkills: [
      {
        type: String,
        trim: true,
      },
    ],

    preferredSkills: [
      {
        type: String,
        trim: true,
      },
    ],

    // ============================================================
    // BUDGET & PRICING
    // ============================================================

    // Amount intended for the developer/project.
    budget: {
      type: Number,
      required: true,
      min: 0.01,
    },

    minBudget: {
      type: Number,
      min: 0,
      default: null,
    },

    maxBudget: {
      type: Number,
      min: 0,
      default: null,
    },

    currency: {
      type: String,
      enum: ["USD", "KES", "EUR"],
      default: "USD",
      uppercase: true,
    },

    // ============================================================
    // PLATFORM FEE
    // ============================================================

    platformFeePercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 10,
    },

    // Calculated platform fee.
    platformFeeAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    // True only after successful platform-fee payment.
    platformFeePaid: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Amount client pays for project + platform fee.
    clientTotalAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    // ============================================================
    // PROJECT DETAILS
    // ============================================================

    projectType: {
      type: String,
      enum: [
        "Fixed Price",
        "Hourly",
        "Contract",
        "Internship",
      ],
      default: "Fixed Price",
    },

    experienceLevel: {
      type: String,
      enum: [
        "Entry Level",
        "Intermediate",
        "Senior",
        "Expert",
      ],
      default: "Entry Level",
    },

    workMode: {
      type: String,
      enum: [
        "Remote",
        "Hybrid",
        "Onsite",
      ],
      default: "Remote",
    },

    estimatedDuration: {
      type: String,
      enum: [
        "Less than 1 week",
        "1-2 weeks",
        "2-4 weeks",
        "1-3 months",
        "3+ months",
      ],
      default: "1-2 weeks",
    },

    estimatedHours: {
      type: Number,
      min: 0,
      default: 0,
    },

    // ============================================================
    // DEADLINES
    // ============================================================

    applicationDeadline: {
      type: Date,
      required: true,
    },

    projectDeadline: {
      type: Date,
      default: null,
    },

    // ============================================================
    // USERS
    // ============================================================

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    hiredDeveloper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // ============================================================
    // JOB STATUS
    // ============================================================

    status: {
      type: String,
      enum: [
        "Draft",
        "Open",
        "In Progress",
        "Filled",
        "Completed",
        "Closed",
        "Cancelled",
      ],
      default: "Draft",
      index: true,
    },

    // Controls whether developers can see the job.
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Set when the platform fee has been successfully paid
    // and the job becomes publicly available.
    publishedAt: {
      type: Date,
      default: null,
      index: true,
    },

    // ============================================================
    // PAYMENT STATUS
    // ============================================================

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "partially_funded",
        "escrow",
        "partially_released",
        "paid",
        "refunded",
      ],
      default: "pending",
      index: true,
    },

    // ============================================================
    // MILESTONES
    // ============================================================

    milestones: {
      type: [milestoneSchema],
      default: [],
    },

    // ============================================================
    // ESCROW AGGREGATES
    // ============================================================

    escrowAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    releasedAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    refundedAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    // ============================================================
    // CONTRACT
    // ============================================================

    contractUrl: {
      type: String,
      trim: true,
      default: "",
    },

    contractSignedByClient: {
      type: Boolean,
      default: false,
    },

    contractSignedByDeveloper: {
      type: Boolean,
      default: false,
    },

    // ============================================================
    // ANALYTICS
    // ============================================================

    views: {
      type: Number,
      min: 0,
      default: 0,
    },

    applicationCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    savedByUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ============================================================
    // SEARCH
    // ============================================================

    searchScore: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// INDEXES
// ============================================================

jobSchema.index({
  title: "text",
  description: "text",
});

jobSchema.index({
  client: 1,
  status: 1,
  createdAt: -1,
});

jobSchema.index({
  category: 1,
  status: 1,
});

jobSchema.index({
  status: 1,
  isPublished: 1,
  createdAt: -1,
});

jobSchema.index({
  hiredDeveloper: 1,
  status: 1,
});

jobSchema.index({
  createdAt: -1,
});

jobSchema.index({
  budget: 1,
});

jobSchema.index({
  experienceLevel: 1,
});

jobSchema.index({
  projectType: 1,
});

jobSchema.index({
  workMode: 1,
});

jobSchema.index({
  requiredSkills: 1,
});

// ============================================================
// VALIDATION
// ============================================================

jobSchema.pre("validate", function (next) {
  if (
    this.minBudget !== null &&
    this.minBudget !== undefined &&
    this.maxBudget !== null &&
    this.maxBudget !== undefined &&
    this.minBudget > this.maxBudget
  ) {
    return next(
      new Error("minBudget cannot be greater than maxBudget")
    );
  }

  if (
    this.minBudget !== null &&
    this.minBudget !== undefined &&
    this.budget < this.minBudget
  ) {
    return next(
      new Error("budget cannot be less than minBudget")
    );
  }

  if (
    this.maxBudget !== null &&
    this.maxBudget !== undefined &&
    this.budget > this.maxBudget
  ) {
    return next(
      new Error("budget cannot be greater than maxBudget")
    );
  }

  if (this.milestones?.length) {
    const milestoneTotal = this.milestones.reduce(
      (total, milestone) =>
        total + (milestone.amount || 0),
      0
    );

    if (milestoneTotal > this.budget) {
      return next(
        new Error(
          `Milestone total (${milestoneTotal}) cannot exceed job budget (${this.budget})`
        )
      );
    }
  }

  if (
    this.isNew &&
    this.applicationDeadline &&
    this.applicationDeadline <= new Date()
  ) {
    return next(
      new Error(
        "Application deadline must be in the future"
      )
    );
  }

  next();
});

// ============================================================
// CALCULATE PLATFORM FEES
// ============================================================

jobSchema.pre("save", function (next) {
  if (
    this.isNew ||
    this.isModified("budget") ||
    this.isModified("platformFeePercentage")
  ) {
    const feePercentage =
      this.platformFeePercentage || 0;

    this.platformFeeAmount =
      Math.round(
        ((this.budget * feePercentage) / 100) * 100
      ) / 100;

    this.clientTotalAmount =
      Math.round(
        (this.budget + this.platformFeeAmount) * 100
      ) / 100;
  }

  next();
});

// ============================================================
// METHODS
// ============================================================

jobSchema.methods.getMilestone = function (milestoneId) {
  const milestone = this.milestones.id(milestoneId);

  if (!milestone) {
    throw new Error("Milestone not found");
  }

  return milestone;
};

jobSchema.methods.completeMilestone = async function (
  milestoneId
) {
  const milestone = this.getMilestone(milestoneId);

  if (
    !["pending", "in_progress"].includes(
      milestone.status
    )
  ) {
    throw new Error(
      `Cannot complete milestone with status "${milestone.status}"`
    );
  }

  milestone.status = "completed";
  milestone.completedAt = new Date();

  return this.save();
};

jobSchema.methods.approveMilestone = async function (
  milestoneId
) {
  const milestone = this.getMilestone(milestoneId);

  if (milestone.status !== "completed") {
    throw new Error(
      "Only completed milestones can be approved"
    );
  }

  milestone.status = "approved";
  milestone.approvedAt = new Date();

  return this.save();
};

jobSchema.methods.getMilestoneTotal = function () {
  return this.milestones.reduce(
    (total, milestone) =>
      total + milestone.amount,
    0
  );
};

jobSchema.methods.getRemainingAmount = function () {
  return Math.max(
    0,
    this.budget - this.releasedAmount
  );
};

export default mongoose.model("Job", jobSchema);

