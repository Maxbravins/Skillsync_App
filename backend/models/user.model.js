import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // === AUTHENTICATION ===
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      
    },
    password: {
      type: String,
      required: true,
      minlength: 8, // ← BUMP from 6 to 8 (security)
      select: false, // ← Don't return password by default
    },
    role: {
      type: String,
      enum: ["admin", "client", "developer"],
      required: true,
      
    },

    // === SOCIAL AUTH (Add this) ===
    authProvider: {
      type: String,
      enum: ["local", "google", "github"],
      default: "local",
    },
    authProviderId: {
      type: String,
      default: null,
    },

    // === PROFILE ===
    profilePicture: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
      maxlength: 500,
    },
    phone: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    website: {
      type: String,
      default: "",
    },

    // === SKILLS & EXPERIENCE ===
    skills: [{
      type: String,
      
    }],
    experience: {
      type: Number, // Years of experience
      default: 0,
      min: 0,
    },
    experienceLevel: {
      type: String,
      enum: ["Entry Level", "Intermediate", "Senior", "Expert"],
      default: "Entry Level",
    },

    // === PORTFOLIO (CRITICAL UPGRADE) ===
    portfolio: [{
      title: {
        type: String,
        required: true,
      },
      description: String,
      imageUrl: String,
      projectUrl: String,
      technologies: [String],
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],

    // === SOCIAL LINKS ===
    socialLinks: {
      github: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      twitter: { type: String, default: "" },
      youtube: { type: String, default: "" },
    },

    // === RESUME ===
    resume: {
      type: String, // URL to uploaded file
      default: "",
    },

    // === AVAILABILITY ===
    available: {
      type: Boolean,
      default: true,
      
    },
    availabilityStatus: {
      type: String,
      enum: ["available", "busy", "unavailable"],
      default: "available",
    },

    // === RATINGS & REVIEWS (CRITICAL) ===
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    completedJobs: {
      type: Number,
      default: 0,
    },
    responseTime: {
      type: Number, // Average response time in hours
      default: 0,
    },

    // === VERIFICATION (TRUST BUILDING) ===
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationDocuments: {
      idVerified: { type: Boolean, default: false },
      emailVerified: { type: Boolean, default: false },
      phoneVerified: { type: Boolean, default: false },
      identityDocument: { type: String, default: "" }, // URL
    },

    // === COMPANY (for clients) ===
    company: {
      type: String,
      default: "",
    },
    companyWebsite: {
      type: String,
      default: "",
    },
    companySize: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "500+"],
      default: "1-10",
    },

    // === WALLET ===
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalEarned: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },

    // === PREMIUM SUBSCRIPTION ===
    isPremium: {
      type: Boolean,
      default: false,
    
    },
    premiumPlan: {
      type: String,
      enum: ["free", "monthly", "yearly"],
      default: "free",
    },
    premiumStartedAt: {
      type: Date,
      default: null,
    },
    premiumExpiresAt: {
      type: Date,
      default: null,
    },

    // === NOTIFICATION PREFERENCES ===
    notificationPreferences: {
      email: {
        jobMatches: { type: Boolean, default: true },
        applicationUpdates: { type: Boolean, default: true },
        paymentUpdates: { type: Boolean, default: true },
        marketing: { type: Boolean, default: false },
      },
      push: {
        messages: { type: Boolean, default: true },
        orderUpdates: { type: Boolean, default: true },
      },
    },

    // === PASSWORD RESET ===
    resetPasswordToken: {
      type: String,
      default: "",
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },

    // === LAST ACTIVITY ===
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// === INDEXES (CRITICAL FOR PERFORMANCE) ===
userSchema.index({ skills: 1 });
userSchema.index({ rating: -1 });
userSchema.index({ completedJobs: -1 });
userSchema.index({ role: 1, available: 1 });
userSchema.index({ isPremium: 1 });

// === VIRTUAL: Full name ===
userSchema.virtual('fullName').get(function() {
  return this.username;
});

// === METHODS ===
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

export default mongoose.model("User", userSchema);