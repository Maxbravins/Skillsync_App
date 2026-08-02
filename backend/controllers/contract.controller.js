import Contract from "../models/contract.model.js";
import Transaction from "../models/transaction.model.js";
import Wallet from "../models/wallet.model.js";
import Notification from "../models/notification.model.js";
import { initiateSTKPush } from "../services/mpesa.service.js";
import { sendPaymentReleasedEmail } from "../services/email.service.js";

export const fundContract = async (req, res) => {
    try {

        const { contractId } = req.params;

        const { phoneNumber } = req.body;

        const contract = await Contract.findById(contractId);

        if (!contract) {

            return res.status(404).json({
                success:false,
                message:"Contract not found."
            });

        }

        if(contract.client.toString() !== req.user.id){

            return res.status(403).json({
                success:false,
                message:"Unauthorized."
            });

        }

        if(contract.paymentStatus !== "unpaid"){

            return res.status(400).json({
                success:false,
                message:"Contract already funded."
            });

        }

        const stk = await initiateSTKPush({

            phoneNumber,

            amount:contract.amount,

            accountReference:`CONTRACT-${contract._id}`,

            transactionDesc:`Funding ${contract._id}`

        });

        const transaction = await Transaction.create({

            contract:contract._id,

            application:contract.application,

            job:contract.job,

            client:contract.client,

            developer:contract.developer,

            paymentType:"contract_payment",

            amount:contract.amount,

            commission:contract.commission,

            developerAmount:contract.developerAmount,

            phoneNumber,

            merchantRequestID:stk.MerchantRequestID,

            checkoutRequestID:stk.CheckoutRequestID,

            status:"pending"

        });

        contract.transaction = transaction._id;

        contract.paymentStatus="pending";

        await contract.save();

        res.json({

            success:true,

            message:"STK Push sent.",

            transaction

        });

    }

    catch(error){

        res.status(500).json({

            success:false,

            message:error.message

        });

    }
};

export const contractCallback = async (req,res)=>{

    try{

        const callback=req.body.Body?.stkCallback;

        if(!callback){

            return res.json({
                ResultCode:0,
                ResultDesc:"Accepted"
            });

        }

        const transaction=await Transaction.findOne({

            checkoutRequestID:callback.CheckoutRequestID

        });

        if(!transaction){

            return res.json({
                ResultCode:0,
                ResultDesc:"Accepted"
            });

        }

        transaction.resultCode=callback.ResultCode;

        transaction.resultDesc=callback.ResultDesc;

        if(callback.ResultCode===0){

            transaction.status="completed";

            transaction.paidAt=new Date();

            await transaction.save();

            const contract=await Contract.findById(transaction.contract);

            contract.paymentStatus="paid";

            contract.status="active";

            contract.startedAt=new Date();

            await contract.save();

            const wallet=await Wallet.findOne({

                developer:contract.developer

            });

            wallet.pendingBalance += contract.developerAmount;

            wallet.totalEarned += contract.developerAmount;

            await wallet.save();

            await Notification.create({

                user:contract.developer,

                message:"Your contract has been funded."

            });

        }

        else{

            transaction.status="failed";

            await transaction.save();

        }

        return res.json({

            ResultCode:0,

            ResultDesc:"Accepted"

        });

    }

    catch(error){

        console.log(error);

        return res.json({

            ResultCode:0,

            ResultDesc:"Accepted"

        });

    }

};

export const getMyContracts = async (req, res) => {
  try {

    let filter = {};

    if (req.user.role === "client") {
      filter.client = req.user.id;
    }

    if (req.user.role === "developer") {
      filter.developer = req.user.id;
    }

    const contracts = await Contract.find(filter)
      .populate("job", "title budget")
      .populate("client", "username")
      .populate("developer", "username")
      .sort({ createdAt: -1 }); 

    res.json({
      success: true,
      count: contracts.length,
      contracts,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

export const releasePayment = async (req, res) => {
    try {

        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin access required."
            });
        }

        const contract = await Contract.findById(req.params.contractId)
            .populate("developer", "username email");

        if (!contract) {
            return res.status(404).json({
                success: false,
                message: "Contract not found."
            });
        }

        if (contract.paymentStatus !== "paid") {
            return res.status(400).json({
                success: false,
                message: "Contract has not been funded."
            });
        }

        if (contract.paymentStatus === "released") {
            return res.status(400).json({
                success: false,
                message: "Payment already released."
            });
        }

        const wallet = await Wallet.findOne({
            developer: contract.developer._id,
        });

        wallet.pendingBalance -= contract.developerAmount;
        wallet.availableBalance += contract.developerAmount;

        await wallet.save();

        contract.paymentStatus = "released";
        contract.releasedAt = new Date();
        contract.releasedBy = req.user.id;

        await contract.save();

        await Transaction.findByIdAndUpdate(
            contract.transaction,
            {
                released: true,
                releasedAt: new Date(),
            }
        );

        await Notification.create({
            user: contract.developer._id,
            message: `Payment for your contract has been released.`,
        });

        await sendPaymentReleasedEmail({
            email: contract.developer.email,
            developerName: contract.developer.username,
            amount: contract.developerAmount,
        });

        res.json({
            success: true,
            message: "Payment released successfully.",
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};