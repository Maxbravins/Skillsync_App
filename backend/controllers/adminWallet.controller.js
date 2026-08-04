import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import Wallet from "../models/wallet.model.js";
import { sendPaymentReleasedEmail } from "../services/email.service.js";

export const releasePayment = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can release payments.",
      });
    }
    const { developerId } = req.params;

    const wallet = await Wallet.findOne({
      developer: developerId,
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    if (wallet.pendingBalance <= 0) {
      return res.status(400).json({
        success: false,
        message: "No pending payment available.",
      });
    }

    const releasedAmount = wallet.pendingBalance;

    wallet.availableBalance += releasedAmount;
    wallet.pendingBalance = 0;

    await wallet.save();
    const developer = await User.findById(developerId);
    await Notification.create({
      user: developerId,
      message: `KES ${releasedAmount} has been released to your wallet.`,
    });

    await sendPaymentReleasedEmail({
      email: developer.email,
      developerName: developer.username,
      amount: releasedAmount,
    });

    res.status(200).json({
      success: true,
      message: "Payment released successfully.",
      developer,
      wallet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
