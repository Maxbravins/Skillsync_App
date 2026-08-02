import Wallet from "../models/wallet.model.js";
import Withdrawal from "../models/withdrawal.model.js";

export const requestWithdrawal = async (req,res)=>{

try{

const {amount,phoneNumber}=req.body;

const wallet=await Wallet.findOne({

developer:req.user.id

});

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

res.json({

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

const withdrawals=await Withdrawal.find({

developer:req.user.id

}).sort({

createdAt:-1

});

res.json({

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