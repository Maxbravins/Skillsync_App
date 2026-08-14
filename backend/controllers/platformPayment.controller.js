import Job from "../models/job.model.js";
import Transaction from "../models/transaction.model.js";
import User from "../models/user.model.js";
import { initiateSTKPush } from "../services/mpesa.service.js";
import { calculatePlatformFee } from "../services/platformFee.service.js";
import Notification from "../models/notification.model.js";
import { sendNewJobAlertEmail } from "../services/email.service.js";

    // PAY PLATFORM FEE
export const payPlatformFee = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { phoneNumber } = req.body;

    // Validate phone number
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required.",
      });
    }

    // Find job
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    
    // Make sure current user owns the job
    if (job.client.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to pay for this job.",
      });
    }

    // Prevent duplicate payment
    if (job.platformFeePaid === true) {
      return res.status(400).json({
        success: false,
        message: "Platform fee has already been paid.",
      });
    }

    // Prevent another pending payment
    const existingPendingTransaction = await Transaction.findOne({
      job: job._id,
      paymentType: "platform_fee",
      status: "pending",
    });

    if (existingPendingTransaction) {
      return res.status(400).json({
        success: false,
        message:
          "A platform fee payment is already pending. Please complete the M-Pesa prompt.",
        transaction: existingPendingTransaction,
      });
    }

    // Calculate platform fee
    const fee = calculatePlatformFee(job.budget);

    if (!fee || fee <= 0) {
      return res.status(400).json({
        success: false,
        message: "Unable to calculate platform fee.",
      });
    }

    // Save platform fee to job
    job.platformFee = fee;

    // Job MUST remain unpublished until payment succeeds.
    job.platformFeePaid = false;
    job.isPublished = false;

   // Set job status to "Open" if not already set
    if (!job.status) {
      job.status = "Open";
    }

    await job.save();
 
    //Initiate M-Pesa STK Push
    const stkResponse = await initiateSTKPush({
      phoneNumber,
      amount: fee,
      accountReference: `JOB-${job._id}`,
      transactionDesc: `Platform Fee for ${job.title}`,
    });

    // Validate STK response
    if (
      !stkResponse ||
      !stkResponse.CheckoutRequestID
    ) {
      return res.status(500).json({
        success: false,
        message:
          "M-Pesa payment could not be initiated. Please try again.",
      });
    }

    // Create pending transaction
    const transaction = await Transaction.create({
      job: job._id,
      client: req.user.id,

      // Platform fee payment
      amount: fee,

      // Required transaction fields
      projectAmount: job.budget,
      platformFee: fee,

      // For this transaction the client is only paying
      // the platform fee.
      totalAmount: fee,

      phoneNumber,

      paymentType: "platform_fee",

      status: "pending",

      merchantRequestID:
        stkResponse.MerchantRequestID || "",

      checkoutRequestID:
        stkResponse.CheckoutRequestID,
    });

    // Response
    return res.status(200).json({
      success: true,
      message:
        "Platform payment initiated. Please complete the M-Pesa prompt.",
      transaction,
    });
  } catch (error) {
    console.error(
      "Platform fee payment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to initiate platform fee payment.",
    });
  }
};

    // M-PESA PLATFORM FEE CALLBACK
export const platformCallback = async (req, res) => {
  try {
    console.log(
      "========== M-PESA PLATFORM CALLBACK =========="
    );

    console.log(
      JSON.stringify(req.body, null, 2)
    );

    const callback =
      req.body?.Body?.stkCallback;

        // Validate callback
    if (!callback) {
      console.log(
        "Invalid M-Pesa callback received."
      );

      return res.json({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });
    }

    const checkoutRequestID =
      callback.CheckoutRequestID;

    // Find transaction
    const transaction =
      await Transaction.findOne({
        checkoutRequestID,
      });

    if (!transaction) {
      console.log(
        "Transaction not found:",
        checkoutRequestID
      );

      return res.json({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });
    }

        //Prevent duplicate callback processing
    if (transaction.status === "completed") {
      console.log(
        "Transaction already completed:",
        transaction._id
      );

      return res.json({
        ResultCode: 0,
        ResultDesc: "Already processed",
      });
    }

    // Save M-Pesa result
    transaction.resultCode =
      callback.ResultCode;

    transaction.resultDesc =
      callback.ResultDesc || "";

    // SUCCESSFUL PAYMENT
    if (callback.ResultCode === 0) {
      console.log(
        "Platform fee payment SUCCESSFUL"
      );

      // Extract M-Pesa receipt number     
      const metadata =
        callback.CallbackMetadata?.Item || [];

      const receiptItem = metadata.find(
        (item) =>
          item.Name === "MpesaReceiptNumber"
      );

      if (receiptItem) {
        transaction.mpesaReceiptNumber =
          receiptItem.Value;
      }

      // Mark transaction completed
      transaction.status = "completed";
      transaction.paidAt = new Date();

      await transaction.save();

      console.log(
        "Transaction marked completed:",
        transaction._id
      );

      // Find job
      const job = await Job.findById(
        transaction.job
      )
        .populate("category")
        .populate(
          "client",
          "username email"
        );

      if (!job) {
        console.error(
          "Job not found for transaction:",
          transaction._id
        );

        return res.json({
          ResultCode: 0,
          ResultDesc: "Accepted",
        });
      }

      // Publish the job AFTER successful payment    
      job.platformFeePaid = true;

      job.isPublished = true;

      job.paymentStatus = "paid";

      job.status = "published";

      job.publishedAt = new Date();

      await job.save();

      console.log(
        "JOB SUCCESSFULLY PUBLISHED:",
        job._id
      );

      // Get client
      const client = await User.findById(
        transaction.client
      ).select("username email");

      
      // Prepare category
      const categoryId =
        job.category?._id || job.category;

      const categoryName =
        job.category?.name ||
        "Software Development";

        //Normalize job skills
      let jobSkills = [];

      if (Array.isArray(job.skills)) {
        jobSkills = job.skills
          .flatMap((skill) =>
            typeof skill === "string"
              ? skill
                  .split(/[,\n]+/)
                  .map((s) => s.trim())
                  .filter(Boolean)
              : []
          );
      } else if (
        typeof job.skills === "string"
      ) {
        jobSkills = job.skills
          .split(/[,\n]+/)
          .map((skill) => skill.trim())
          .filter(Boolean);
      }

      console.log(
        "Job skills:",
        jobSkills
      );

      // Find developers to notify based on category and availability
      const developers =
        await User.find({
          role: "developer",

          category: categoryId,

          available: true,

          emailNotifications: true,

          email: {
            $exists: true,
            $ne: "",
          },
        });

      console.log(
        `Found ${developers.length} developers to notify.`
      );

      // Notify developers     
      for (const developer of developers) {
        try {
         
          // Send email        
          await sendNewJobAlertEmail({
            email: developer.email,

            developerName:
              developer.username,

            jobTitle: job.title,

            category: categoryName,

            budget: job.budget,

            clientName:
              client?.username ||
              "SkillSync Client",
          });

          console.log(
            `Email sent to ${developer.email}`
          );
        } catch (emailError) {
          console.error(
            `Failed to send email to ${developer.email}:`,
            emailError.message
          );
        }

        try {
          
          // Create in-app notification
          await Notification.create({
            user: developer._id,

            message: `A new "${job.title}" project has been posted.`,
          });

          console.log(
            `Notification created for ${developer.username}`
          );
        } catch (notificationError) {
          console.error(
            `Failed to create notification for ${developer.username}:`,
            notificationError.message
          );
        }
      }

      console.log(
        "========== PLATFORM PAYMENT COMPLETE =========="
      );
    } else {
      
      // PAYMENT FAILED / CANCELLED
      console.log(
        "Platform fee payment FAILED:",
        callback.ResultCode,
        callback.ResultDesc
      );

      transaction.status = "failed";

      await transaction.save();

      // Make sure job remains unpublished    
      const job = await Job.findById(
        transaction.job
      );

      if (job) {
        job.platformFeePaid = false;

        job.isPublished = false;

        job.paymentStatus = "pending";

        await job.save();
      }
    }
  
    // Always acknowledge M-Pesa
    return res.json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  } catch (error) {
    console.error(
      "Platform callback error:",
      error
    );

    
    return res.json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  }
};