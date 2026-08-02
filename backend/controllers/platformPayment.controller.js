import Job from "../models/job.model.js";
import Transaction from "../models/transaction.model.js";
import User from "../models/user.model.js";
import { initiateSTKPush } from "../services/mpesa.service.js";
import { calculatePlatformFee } from "../services/platformFee.service.js";
import Notification from "../models/notification.model.js";
import { sendNewJobAlertEmail } from "../services/email.service.js";

export const payPlatformFee = async (req, res) => {
    try {

        const { jobId } = req.params;

        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: "Phone number is required",
            });
        }

        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        if (job.client.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (job.platformFeePaid) {
            return res.status(400).json({
                success: false,
                message: "Platform fee already paid.",
            });
        }

        const fee = calculatePlatformFee(job.budget);

        job.platformFee = fee;

        await job.save();

        const stkResponse = await initiateSTKPush({

            phoneNumber,

            amount: fee,

            accountReference: `JOB-${job._id}`,

            transactionDesc: `Platform Fee for ${job.title}`,

        });

        const transaction = await Transaction.create({

            job: job._id,

            client: req.user.id,

            amount: fee,

            phoneNumber,

            paymentType: "platform_fee",

            status: "pending",

            merchantRequestID:
                stkResponse.MerchantRequestID,

            checkoutRequestID:
                stkResponse.CheckoutRequestID,

        });

        res.json({

            success: true,

            message: "Platform payment initiated.",

            transaction,

        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message,

        });

    }
};

export const platformCallback = async (req, res) => {

    try {

        const callback = req.body.Body?.stkCallback;

        if (!callback) {

            return res.json({
                ResultCode: 0,
                ResultDesc: "Accepted",
            });

        }

        const transaction =
            await Transaction.findOne({

                checkoutRequestID:
                    callback.CheckoutRequestID,

            });

        if (!transaction) {

            return res.json({
                ResultCode: 0,
                ResultDesc: "Accepted",
            });

        }

        transaction.resultCode = callback.ResultCode;

        transaction.resultDesc = callback.ResultDesc;

        if (callback.ResultCode === 0) {

            transaction.status = "completed";

            transaction.paidAt = new Date();

            await transaction.save();

            const job = await Job.findById(transaction.job)
            .populate("category")
            .populate("client", "username email");

            job.platformFeePaid = true;

            job.status = "published";

            job.publishedAt = new Date();

            await job.save();

            const client = await User.findById(job.client);

            const developers = await User.find({
            role: "developer",
            category: job.category._id,
            available: true,
            emailNotifications: true,
            skills: {
                $in: job.skills,
            },
        });

        for (const developer of developers) {

        await sendNewJobAlertEmail({
            email: developer.email,
            developerName: developer.username,
            jobTitle: job.title,
            category: job.category.name,
            budget: job.budget,
            clientName: client.username,
        });

        await Notification.create({
            user: developer._id,
            message: `A new "${job.title}" project has been posted.`,
        });
    }
} else {

            transaction.status = "failed";

            await transaction.save();

        }

        res.json({
            ResultCode: 0,
            ResultDesc: "Accepted",
        });

    } catch (error) {

        console.log(error);

        res.json({
            ResultCode: 0,
            ResultDesc: "Accepted",
        });

    }

};