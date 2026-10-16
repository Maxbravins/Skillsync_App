import Job from "../models/job.model.js";
import Transaction from "../models/transaction.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

import {
  initiateSTKPush,
  formatPhoneNumber,
} from "../services/mpesa.service.js";

import { calculatePlatformFee } from "../services/platformFee.service.js";
import { sendNewJobAlertEmail } from "../services/email.service.js";

const publishPaidJob = async (transaction) => {
  if (!transaction?.job || !transaction?.client) return null;

  const existingJob = await Job.findOne({
    _id: transaction.job,
    client: transaction.client,
  }).select("publishedAt");
  if (!existingJob) return null;

  const now = new Date();
  return Job.findOneAndUpdate(
    { _id: transaction.job, client: transaction.client },
    {
      $set: {
        platformFeePaid: true,
        platformFeeAmount:
          transaction.platformFee || transaction.amount,
        isPublished: true,
        status: "Open",
        paymentStatus: "paid",
        publishedAt: existingJob.publishedAt || now,
      },
    },
    { new: true }
  ).populate("category");
};

export const reconcilePlatformFee = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findOne({ _id: jobId, client: req.user.id });

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found." });
    }

    if (job.platformFeePaid && job.isPublished) {
      return res.json({ success: true, published: true, message: "Job is already published." });
    }

    const transaction = await Transaction.findOne({
      job: job._id,
      client: req.user.id,
      status: "completed",
      $or: [{ type: "platform_fee" }, { paymentType: "platform_fee" }],
    }).sort({ createdAt: -1 });

    if (!transaction || Number(transaction.mpesa?.resultCode) !== 0) {
      return res.status(409).json({
        success: false,
        message: "No confirmed platform fee payment was found yet. Do not pay again while M-Pesa confirmation is pending.",
      });
    }

    const publishedJob = await publishPaidJob(transaction);
    if (!publishedJob) {
      return res.status(409).json({ success: false, message: "The paid job could not be found for publishing." });
    }

    return res.json({ success: true, published: true, job: publishedJob, message: "Payment confirmed and job published." });
  } catch (error) {
    console.error("Platform fee reconciliation error:", error);
    return res.status(500).json({ success: false, message: "Unable to reconcile platform fee payment." });
  }
};

// ============================================================
// PAY PLATFORM FEE
// ============================================================

export const payPlatformFee = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { phoneNumber } = req.body;

    // ----------------------------------------------------------
    // Validate phone number
    // ----------------------------------------------------------

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required.",
      });
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);

    // ----------------------------------------------------------
    // Find job
    // ----------------------------------------------------------

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    // ----------------------------------------------------------
    // Verify ownership
    // ----------------------------------------------------------

    if (job.client.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to pay for this job.",
      });
    }

    // ----------------------------------------------------------
    // Prevent duplicate successful payment
    // ----------------------------------------------------------

    if (job.platformFeePaid === true) {
      return res.status(400).json({
        success: false,
        message:
          "Platform fee has already been paid.",
      });
    }

    const completedTransaction = await Transaction.findOne({
      job: job._id,
      client: req.user.id,
      status: "completed",
      $or: [{ type: "platform_fee" }, { paymentType: "platform_fee" }],
    }).sort({ createdAt: -1 });

    if (completedTransaction && Number(completedTransaction.mpesa?.resultCode) === 0) {
      const publishedJob = await publishPaidJob(completedTransaction);
      if (publishedJob) {
        return res.json({
          success: true,
          reconciled: true,
          message: "Your existing payment was confirmed and the job is now published.",
          job: publishedJob,
        });
      }
    }

    // ----------------------------------------------------------
    // Prevent duplicate pending payment
    // ----------------------------------------------------------

    const existingPendingTransaction =
      await Transaction.findOne({
        job: job._id,
        paymentType: "platform_fee",
        status: {
          $in: ["pending", "processing"],
        },
      }).sort({ createdAt: -1 });

    if (existingPendingTransaction) {
      return res.status(400).json({
        success: false,
        message:
          "A platform fee payment is already pending. Please complete the M-Pesa prompt.",
        transaction: existingPendingTransaction,
      });
    }

    // ----------------------------------------------------------
    // Calculate platform fee
    // ----------------------------------------------------------

    const fee = calculatePlatformFee(job.budget);

    if (!fee || fee <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Unable to calculate platform fee.",
      });
    }

    // ----------------------------------------------------------
    // Keep job unpublished until payment succeeds
    // ----------------------------------------------------------

    job.platformFeeAmount = fee;
    job.platformFeePaid = false;
    job.isPublished = false;

    if (!job.status || job.status === "Draft") {
      job.status = "Draft";
    }

    await job.save();

    // Save the transaction before sending the STK prompt. If saving it
    // afterward fails, a real payment can be left without a record for
    // the callback to reconcile.
    const transaction = await Transaction.create({
        type: "platform_fee",
        paymentType: "platform_fee",

        job: job._id,
        client: req.user.id,

        amount: fee,

        projectAmount: job.budget,

        platformFee: fee,

        developerAmount: 0,

        totalAmount: fee,

        currency: job.currency || "KES",

        phoneNumber: formattedPhone,

        paymentMethod: "mpesa",

        description:
          `Platform fee for job ${job._id}`,

        paymentProviderData: {
          provider: "mpesa",
          accountReference: `JOB-${job._id}`,
        },

        mpesa: {
          phoneNumber: formattedPhone,

          resultCode: null,

          resultDesc: "",
        },

        status: "pending",
      });

    // ----------------------------------------------------------
    // Initiate M-Pesa STK Push
    // ----------------------------------------------------------

    const callbackUrl =
      `${process.env.BACKEND_URL}/api/platform-payment/callback`;

    let stkResponse;
    try {
      stkResponse = await initiateSTKPush({
        phoneNumber: formattedPhone,
        amount: fee,
        accountReference: `JOB-${job._id}`,
        transactionDesc: `Platform Fee for ${job.title}`,
        callbackUrl,
      });
    } catch (error) {
      transaction.status = "failed";
      transaction.mpesa.resultDesc = error.message || "M-Pesa could not initiate the payment.";
      await transaction.save();
      throw error;
    }

    if (!stkResponse?.CheckoutRequestID) {
      transaction.status = "failed";
      transaction.mpesa.resultDesc = "M-Pesa did not return a checkout request ID.";
      await transaction.save();
      return res.status(502).json({
        success: false,
        message: "M-Pesa payment could not be initiated. Please try again.",
      });
    }

    transaction.mpesa.merchantRequestID = stkResponse.MerchantRequestID || undefined;
    transaction.mpesa.checkoutRequestID = stkResponse.CheckoutRequestID;
    await transaction.save();

    // ----------------------------------------------------------
    // Return success
    // ----------------------------------------------------------

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

// ============================================================
// M-PESA PLATFORM FEE CALLBACK
// ============================================================

export const platformCallback = async (
  req,
  res
) => {
  try {
    console.log(
      "========== M-PESA PLATFORM CALLBACK =========="
    );

    console.log(
      JSON.stringify(req.body, null, 2)
    );

    const callback =
      req.body?.Body?.stkCallback;

    // ----------------------------------------------------------
    // Validate callback
    // ----------------------------------------------------------

    if (!callback) {
      console.error(
        "Invalid M-Pesa platform callback."
      );

      return res.json({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });
    }

    const checkoutRequestID =
      callback.CheckoutRequestID;

    const merchantRequestID =
      callback.MerchantRequestID;

    // ----------------------------------------------------------
    // Find transaction
    // ----------------------------------------------------------

    let transaction =
      await Transaction.findOne({
        "mpesa.checkoutRequestID":
          checkoutRequestID,
        type: "platform_fee",
      });

    // Fallback using merchant request ID.
    if (!transaction && merchantRequestID) {
      transaction =
        await Transaction.findOne({
          "mpesa.merchantRequestID":
            merchantRequestID,
          type: "platform_fee",
        }).sort({ createdAt: -1 });
    }

    if (!transaction) {
      console.error(
        "Platform transaction not found:",
        {
          checkoutRequestID,
          merchantRequestID,
        }
      );

      return res.json({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });
    }

    // ----------------------------------------------------------
    // Prevent duplicate callback processing
    // ----------------------------------------------------------

    if (transaction.status === "completed") {
      console.log(
        "Reconciling previously completed platform transaction:",
        transaction.transactionId
      );

      const publishedJob = await publishPaidJob(transaction);
      if (!publishedJob) {
        console.error("Could not reconcile completed payment to job:", transaction.transactionId);
      }

      return res.json({
        ResultCode: 0,
        ResultDesc: "Already processed",
      });
    }

    // ----------------------------------------------------------
    // Save callback result
    // ----------------------------------------------------------

    transaction.mpesa.resultCode =
      callback.ResultCode;

    transaction.mpesa.resultDesc =
      callback.ResultDesc || "";

    // ----------------------------------------------------------
    // SUCCESSFUL PAYMENT
    // ----------------------------------------------------------

    if (Number(callback.ResultCode) === 0) {
      console.log(
        "Platform fee payment SUCCESSFUL:",
        transaction.transactionId
      );

      // --------------------------------------------------------
      // Extract receipt
      // --------------------------------------------------------

      const metadata =
        callback.CallbackMetadata?.Item || [];

      const receiptItem =
        metadata.find(
          (item) =>
            item.Name ===
            "MpesaReceiptNumber"
        );

      if (receiptItem?.Value) {
        transaction.mpesa.mpesaReceiptNumber =
          String(receiptItem.Value);
      }

      // --------------------------------------------------------
      // Find job
      // --------------------------------------------------------

      const previousJob = await Job.findOne({
        _id: transaction.job,
        client: transaction.client,
      });

      if (!previousJob) {
        console.error(
          "Job not found for transaction:",
          transaction.transactionId
        );

        return res.json({
          ResultCode: 0,
          ResultDesc: "Accepted",
        });
      }

      const wasPublished = previousJob.isPublished && previousJob.platformFeePaid;

      // --------------------------------------------------------
      // Get client
      // --------------------------------------------------------

      const client =
        await User.findById(
          transaction.client
        ).select(
          "username email"
        );

      const job = await publishPaidJob(transaction);
      if (!job) throw new Error("Paid job could not be published for this transaction.");

      transaction.status = "completed";
      transaction.completedAt = transaction.completedAt || new Date();
      transaction.paidAt = transaction.paidAt || new Date();
      await transaction.save();

      console.log(
        "JOB SUCCESSFULLY PUBLISHED:",
        job._id
      );

      // --------------------------------------------------------
      // Category information
      // --------------------------------------------------------

      const categoryId =
        job.category?._id ||
        job.category;

      const categoryName =
        job.category?.name ||
        "Software Development";

      // --------------------------------------------------------
      // Normalize skills
      // --------------------------------------------------------

      const jobSkills = [
        ...(Array.isArray(job.requiredSkills)
          ? job.requiredSkills
          : []),

        ...(Array.isArray(job.preferredSkills)
          ? job.preferredSkills
          : []),
      ]
        .flatMap((skill) =>
          typeof skill === "string"
            ? skill
                .split(/[,\\n]+/)
                .map((item) =>
                  item.trim()
                )
                .filter(Boolean)
            : []
        );

      console.log(
        "Job skills:",
        jobSkills
      );

      // --------------------------------------------------------
      // Find developers to notify
      // --------------------------------------------------------

      const developers = wasPublished ? [] :
        await User.find({
          role: "developer",

          category: categoryId,

          available: true,

          emailNotifications: true,

          email: {
            $exists: true,
            $ne: "",
          },
        }).select(
          "username email"
        );

      console.log(
        `Found ${developers.length} developers to notify.`
      );

      // --------------------------------------------------------
      // Notify developers
      // --------------------------------------------------------

      for (const developer of developers) {
        // ------------------------------------------------------
        // Email
        // ------------------------------------------------------

        try {
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

        // ------------------------------------------------------
        // In-app notification
        // ------------------------------------------------------

        try {
          await Notification.create({
            user: developer._id,

            message:
              `A new "${job.title}" project has been posted.`,
          });

          console.log(
            `Notification created for ${developer.username}`
          );
        } catch (
          notificationError
        ) {
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
      // --------------------------------------------------------
      // PAYMENT FAILED / CANCELLED
      // --------------------------------------------------------

      console.log(
        "Platform fee payment FAILED:",
        callback.ResultCode,
        callback.ResultDesc
      );

      transaction.status = "failed";

      await transaction.save();

      const job =
        await Job.findById(
          transaction.job
        );

      if (job) {
        job.platformFeePaid = false;
        job.isPublished = false;
        job.paymentStatus = "pending";

        await job.save();
      }
    }

    // ----------------------------------------------------------
    // Always acknowledge M-Pesa
    // ----------------------------------------------------------

    return res.json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  } catch (error) {
    console.error(
      "Platform callback error:",
      error
    );

    // Safaricom expects a response.
    return res.json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  }
};

