import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    // Job Category
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    budget: {
      type: Number,
      required: true,
    },

    platformFee: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      default: 0,
    },
    // Payment status: pending, paid
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    
    isPublished: {
      type: Boolean,
      default: false,
    },

    // Platform fee (10%)
    platformFee: {
      type: Number,
      default: 0,
    },

    // Amount client pays
    totalCost: {
      type: Number,
      default: 0,
    },

    // Experience level required
    experienceLevel: {
      type: String,
      enum: [
        "Entry Level",
        "Intermediate",
        "Senior"
      ],
      default: "Entry Level",
    },

    // Project type
    projectType: {
      type: String,
      enum: [
        "Fixed Price",
        "Hourly",
        "Contract",
        "Internship"
      ],
      default: "Fixed Price",
    },

    // Work arrangement
    workMode: {
      type: String,
      enum: [
        "Remote",
        "Hybrid",
        "Onsite"
      ],
      default: "Remote",
    },

    // Application deadline
    deadline: {
      type: Date,
    },

    skills: [
      {
        type: String,
      },
    ],

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Status of the job posting: Open, Closed, or Filled
    status: {
      type: String,
      enum: [
        "Open",
        "Closed",
        "Filled"
      ],
      default: "Open",
    },
  },
  {
    timestamps: true,
  }
);

const Job =
  mongoose.models.Job ||
  mongoose.model("Job", jobSchema);

export default Job;