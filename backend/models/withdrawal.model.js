import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
{
    developer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },

    wallet:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Wallet",
        required:true,
    },

    amount:{
        type:Number,
        required:true,
    },

    phoneNumber:{
        type:String,
        required:true,
    },

    status:{
        type:String,
        enum:[
            "pending",
            "approved",
            "paid",
            "rejected"
        ],
        default:"pending",
    },

    transaction:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Transaction",
        default:null,
    },

    remarks:{
        type:String,
        default:"",
    },

    processedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        default:null,
    }

},
{
    timestamps:true,
}
);

export default mongoose.model(
    "Withdrawal",
    withdrawalSchema
);