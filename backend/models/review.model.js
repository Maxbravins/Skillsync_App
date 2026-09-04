// backend/models/Review.js
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    comment: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    communication: {
      type: Number,
      min: 1,
      max: 5,
    },
    quality: {
      type: Number,
      min: 1,
      max: 5,
    },
    deadline: {
      type: Number,
      min: 1,
      max: 5,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: true, // Only verified purchases can review
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ reviewee: 1, rating: -1 });
reviewSchema.index({ job: 1 }, { unique: true });

// Hook to update user rating
reviewSchema.post("save", async function() {
  const User = mongoose.model("User");
  const stats = await this.model("Review").aggregate([
    { $match: { reviewee: this.reviewee } },
    { $group: {
      _id: "$reviewee",
      avgRating: { $avg: "$rating" },
      totalReviews: { $sum: 1 }
    }}
  ]);
  
  if (stats.length > 0) {
    await User.findByIdAndUpdate(this.reviewee, {
      rating: stats[0].avgRating,
      totalReviews: stats[0].totalReviews,
    });
  }
});

export default mongoose.model("Review", reviewSchema);