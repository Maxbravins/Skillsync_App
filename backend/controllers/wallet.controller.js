import Wallet from "../models/wallet.model.js";

export const getMyWallet = async (req, res) => {

    try {

        const wallet = await Wallet.findOne({

            developer: req.user.id,

        });

        if (!wallet) {

            return res.status(404).json({

                success: false,

                message: "Wallet not found.",

            });

        }

        res.json({

            success: true,

            wallet,

        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};