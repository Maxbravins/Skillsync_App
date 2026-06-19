import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },

    coverLetter: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
      },
      {
        timestamps: true,
      }
    );

const Application =
  mongoose.models.Application ||
  mongoose.model("Application", applicationSchema);

export default Application;