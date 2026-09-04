import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    // ============================================================
    // WALLET OWNER
    // ============================================================

    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
      index: true,
    },

    // AVAILABLE BALANCE
    availableBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // PENDING BALANCE
    
    pendingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // PENDING WITHDRAWAL
    pendingWithdrawal: {
      type: Number,
      default: 0,
      min: 0,
    },

    // TOTAL EARNED

       totalEarned: {
      type: Number,
      default: 0,
      min: 0,
    },

    // TOTAL WITHDRAWN  Lifetime amount successfully withdrawn by developer
   
    totalWithdrawn: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

  // MODEL
const Wallet =
  mongoose.models.Wallet ||
  mongoose.model("Wallet", walletSchema);

export default Wallet;