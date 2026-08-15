import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
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
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["admin", "client", "developer"],
      required: true,
    },

    // NEW
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    profilePicture: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
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

    skills: {
      type: [String],
      default: [],
    },

    experience: {
      type: Number,
      default: 0,
    },

    github: {
      type: String,
      default: "",
    },

    linkedin: {
      type: String,
      default: "",
    },

    portfolio: {
      type: String,
      default: "",
    },

    resume: {
      type: String,
      default: "",
    },

    // Developer Availability
    available: {
      type: Boolean,
      default: true,
    },

    // Email notification preference
    emailNotifications: {
      type: Boolean,
      default: true,
    },

    // Client Company
    company: {
      type: String,
      default: "",
    },

    companyWebsite: {
      type: String,
      default: "",
    },

    // Wallet (future payments)
    walletBalance: {
      type: Number,
      default: 0,
    },

// Premium Subscription
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

    resetPasswordToken: {
      type: String,
      default: "",
    },

    resetPasswordExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);