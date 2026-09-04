import Wallet from "../models/wallet.model.js";

export const getMyWallet = async (req, res) => {
  try {
    // Only developers should have/access a developer wallet
    if (req.user.role !== "developer") {
      return res.status(403).json({
        success: false,
        message: "Only developers can access a wallet.",
      });
    }

    const wallet = await Wallet.findOne({
      developer: req.user.id,
    }).populate(
      "developer",
      "username email profilePicture"
    );

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    return res.status(200).json({
      success: true,
      wallet,
    });
  } catch (error) {
    console.error("Get wallet error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve wallet.",
    });
  }
};
