import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    // === BASIC INFO ===
    title: {
      type: String,
      required: true,
      trim: true,
      
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
     
    },

    // === SKILLS REQUIRED ===
    requiredSkills: [{
      type: String,
      
    }],
    preferredSkills: [{
      type: String,
    }],

    // === BUDGET & PRICING ===
    budget: {
      type: Number,
      required: true,
      min: 1,
    },
    minBudget: {
      type: Number,
      min: 0,
    },
    maxBudget: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      enum: ["USD", "KES", "EUR"],
      default: "USD",
    },

    // === PLATFORM FEES (Single source of truth) ===
    platformFeePercentage: {
      type: Number,
      default: 10, // 10%
    },
    platformFeeAmount: {
      type: Number,
      default: 0,
    },
    clientTotalAmount: {
      type: Number,
      default: 0,
    },

    // === PROJECT DETAILS ===
    projectType: {
      type: String,
      enum: ["Fixed Price", "Hourly", "Contract", "Internship"],
      default: "Fixed Price",
      
    },
    experienceLevel: {
      type: String,
      enum: ["Entry Level", "Intermediate", "Senior", "Expert"],
      default: "Entry Level",
      
    },
    workMode: {
      type: String,
      enum: ["Remote", "Hybrid", "Onsite"],
      default: "Remote",
      
    },
    estimatedDuration: {
      type: String,
      enum: ["Less than 1 week", "1-2 weeks", "2-4 weeks", "1-3 months", "3+ months"],
      default: "1-2 weeks",
    },
    estimatedHours: {
      type: Number,
      default: 0,
    },

    // === DEADLINES ===
    applicationDeadline: {
      type: Date,
      required: true,
    },
    projectDeadline: {
      type: Date,
      default: null,
    },

    // === CLIENT ===
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      
    },

    // === HIRED DEVELOPER ===
    hiredDeveloper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // === STATUS ===
    status: {
      type: String,
      enum: ["Draft", "Open", "In Progress", "Filled", "Completed", "Closed", "Cancelled"],
      default: "Draft",
      
    },
    isPublished: {
      type: Boolean,
      default: false,
      
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "escrow", "paid", "refunded"],
      default: "pending",
    },

    // === MILESTONES (CRITICAL FOR ESCROW) ===
    milestones: [{
      title: {
        type: String,
        required: true,
      },
      description: String,
      amount: {
        type: Number,
        required: true,
        min: 1,
      },
      status: {
        type: String,
        enum: ["pending", "in_progress", "completed", "approved", "disputed"],
        default: "pending",
      },
      dueDate: Date,
      completedAt: Date,
      approvedAt: Date,
    }],

    // === PAYMENT ===
    escrowAmount: {
      type: Number,
      default: 0,
    },
    releasedAmount: {
      type: Number,
      default: 0,
    },

    // === CONTRACT ===
    contractUrl: {
      type: String,
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

    // === ANALYTICS ===
    views: {
      type: Number,
      default: 0,
    },
    applicationCount: {
      type: Number,
      default: 0,
    },
    savedByUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],

    // === SEARCH OPTIMIZATION ===
    searchScore: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// === INDEXES ===
jobSchema.index({ title: "text", description: "text" });
jobSchema.index({ category: 1, status: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ budget: 1 });
jobSchema.index({ experienceLevel: 1 });
jobSchema.index({ projectType: 1 });
jobSchema.index({ workMode: 1 });
jobSchema.index({ requiredSkills: 1 });

// === HOOKS: Auto-calculate fees ===
jobSchema.pre("save", function(next) {
  if (this.budget) {
    this.platformFeePercentage = 10;
    this.platformFeeAmount = (this.budget * this.platformFeePercentage) / 100;
    this.clientTotalAmount = this.budget + this.platformFeeAmount;
    this.escrowAmount = this.budget; // Hold full budget in escrow
  }
  next();
});

// === METHODS ===
jobSchema.methods.releaseMilestone = function(milestoneId) {
  const milestone = this.milestones.id(milestoneId);
  if (!milestone) throw new Error("Milestone not found");
  
  milestone.status = "completed";
  milestone.completedAt = new Date();
  
  this.releasedAmount += milestone.amount;
  this.escrowAmount -= milestone.amount;
  
  if (this.releasedAmount >= this.budget) {
    this.paymentStatus = "paid";
    this.status = "Completed";
  }
  
  return this.save();
};

export default mongoose.model("Job", jobSchema);