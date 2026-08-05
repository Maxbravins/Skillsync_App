import Wallet from "../models/wallet.model.js";
import Withdrawal from "../models/withdrawal.model.js";
import User from "../models/notification.model.js";
import { sendWithdrawalApprovedEmail, sendWithdrawalRejectedEmail,
 } from "../services/email.service.js";
import { initiateB2CPayment } from "../services/mpesa.service.js";

export const requestWithdrawal = async (req,res)=>{
    
 try{

const {amount,phoneNumber}=req.body;
    if (!amount || amount <= 0) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid withdrawal amount.",
        });
        }

        if (!phoneNumber) {
        return res.status(400).json({
            success: false,
            message: "Phone number is required.",
        });
        }

const wallet=await Wallet.findOne({
    developer:req.user.id
    });

const existingWithdrawal = await Withdrawal.findOne({
    developer: req.user.id,
    status: "pending",
    });

    if (existingWithdrawal) {
       return res.status(400).json({
        success: false,
        message: "You already have a pending withdrawal request.",
    });
    }

    if(!wallet){
        return res.status(404).json({
        success:false,
        message:"Wallet not found."
        });
        }

    if(amount>wallet.availableBalance){
        return res.status(400).json({
        success:false,
        message:"Insufficient balance."
        });
        }

const withdrawal=await Withdrawal.create({
    developer:req.user.id,
    wallet:wallet._id,
    amount,
    phoneNumber
    });

wallet.availableBalance-=amount;
    await wallet.save();
    res.status(201).json({
    success:true,
    message:"Withdrawal request submitted.",
    withdrawal
    });

    }

catch(error){
    res.status(500).json({
    success:false,
    message:error.message
    });
    }
    };

export const getMyWithdrawals=async(req,res)=>{

try{

    const withdrawals = await Withdrawal.find({
        developer: req.user.id,
        })
        .populate("wallet")
        .sort({
            createdAt: -1,
        });

    res.status(200).json({
        success:true,
        withdrawals
        });
    }

    catch(error){
        res.status(500).json({
        success:false,
        message:error.message
        });
        }
        };

        // Admin approves withdrawal
export const approveWithdrawal = async (req, res) => {
  try {

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can approve withdrawals.",
      });
    }

    const withdrawal = await Withdrawal.findById(req.params.id)
      .populate("developer")
      .populate("wallet");

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal not found.",
      });
    }

    if (withdrawal.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Withdrawal already processed.",
      });
    }

    withdrawal.status = "approved";
    withdrawal.processedBy = req.user.id;

    await withdrawal.save();

    await Notification.create({
        user: withdrawal.developer._id,
        message: `Your withdrawal request of KES ${withdrawal.amount} has been approved.`,
        });

    await sendWithdrawalApprovedEmail({
        email: withdrawal.developer.email,
        developerName: withdrawal.developer.username,
        amount: withdrawal.amount,
        });

    res.json({
      success: true,
      message: "Withdrawal approved successfully.",
      withdrawal,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// Admin rejects withdrawal
export const rejectWithdrawal = async (req, res) => {
  try {

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can reject withdrawals.",
      });
    }

    const withdrawal = await Withdrawal.findById(req.params.id)
      .populate("wallet")
      .populate("developer", "username email");

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal not found.",
      });
    }

    if (withdrawal.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Withdrawal already processed.",
      });
    }

    withdrawal.status = "rejected";
    withdrawal.processedBy = req.user.id;

    await withdrawal.save();

    // Return the money to the wallet
    withdrawal.wallet.availableBalance += withdrawal.amount;

    await withdrawal.wallet.save();
    
    await Notification.create({
        user: withdrawal.developer._id,
        message: `Your withdrawal request of KES ${withdrawal.amount} has been rejected.`,
        });

    await sendWithdrawalRejectedEmail({
        email: withdrawal.developer.email,
        developerName: withdrawal.developer.username,
        amount: withdrawal.amount,
        });

    res.json({
      success: true,
      message: "Withdrawal rejected.",
      withdrawal,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
        // Admin initiates B2C payment for approved withdrawal
export const sendWithdrawalPayment = async (req, res) => {
  try {

    const withdrawal = await Withdrawal.findById(req.params.id)
      .populate("developer")
      .populate("wallet");

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal not found.",
      });
    }

    if (withdrawal.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Only approved withdrawals can be paid.",
      });
    }

        // Initiate B2C payment using M-Pesa API
    const b2cResponse = await initiateB2CPayment({
        phoneNumber: withdrawal.phoneNumber,
        amount: withdrawal.amount,
        remarks: `Withdrawal ${withdrawal._id}`,
        occasion: "SkillSync Withdrawal",
        });

        withdrawal.status = "paid";

        await withdrawal.save();

        withdrawal.wallet.totalWithdrawn += withdrawal.amount;

        await withdrawal.wallet.save();

        res.json({
        success: true,
        message: "B2C payment initiated successfully.",
        mpesa: b2cResponse,
        });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

export const b2cResultCallback = async (req, res) => {
  try {

    console.log("B2C Result Callback:", req.body);

    // We'll process the response here later.

    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });

  } catch (error) {

    console.error(error);

    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });

  }
};

export const b2cTimeoutCallback = async (req, res) => {

  console.log("B2C Timeout:", req.body);

  return res.status(200).json({
    ResultCode: 0,
    ResultDesc: "Accepted",
  });

};