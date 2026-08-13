import Application from "../models/application.model.js";
import Job from "../models/job.model.js";
import Notification from "../models/notification.model.js";
import { sendApplicationEmail, sendAcceptanceEmail, sendRejectionEmail } from "../services/email.service.js";
import Contract from "../models/contract.model.js";
import { calculateCommission,  calculateDeveloperAmount } from "../services/platformFee.service.js";

// Apply for a job
export const applyForJob = async (req, res) => {
  try {
    const { coverLetter } = req.body;
    const { jobId } = req.params;

    // Check if job exists
        const job = await Job.findById(jobId).populate(
        "client",
        "username email"
      );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Prevent duplicate applications
    const existingApplication =
      await Application.findOne({
        developer: req.user.id,
        job: jobId,
      });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "You have already applied for this job",
      });
    }

    // Create application
    const application = await Application.create({
      developer: req.user.id,
      job: jobId,
      coverLetter,
    });

   // Populate developer username
      await application.populate(
        "developer",
        "username"
      );

      // Create notification for client
      await Notification.create({
        user: job.client._id,
        message: `${application.developer.username} applied for your job "${job.title}".`,
      });

      // Send email to client
      await sendApplicationEmail({
        email: job.client.email,
        clientName: job.client.username,
        developerName: application.developer.username,
        jobTitle: job.title,
      });

      res.status(201).json({
        success: true,
        message: "Application submitted successfully",
        application,
      });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get applications for a specific job
export const getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Find the job
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    // Make sure the logged-in client owns this job
    if (job.client.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view these applications.",
      });
    }

    // Get applications
    const applications = await Application.find({
      job: jobId,
    })
      .populate("developer", "username email")
      .populate("job", "title description budget");

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Get job applications error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get my applications
export const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({
      developer: req.user.id,
    })
      .populate("job", "title description budget")
      .populate("developer", "username email");

    res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all applications for all jobs posted by a client
export const getClientApplications =
  async (req, res) => {
    try {
      // Find jobs created by this client
      const jobs = await Job.find({
        client: req.user.id,
      });

      const jobIds = jobs.map(
        (job) => job._id
      );

      // Find applications for those jobs
      const applications =
        await Application.find({
          job: {
            $in: jobIds,
          },
        })
          .populate(
            "developer",
            "username email"
          )
          .populate(
            "job",
            "title"
          );

      res.status(200).json({
        success: true,
        count:
          applications.length,
        applications,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

// Update application status
export const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { applicationId } = req.params;

    // Only these two status changes are allowed
    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application status.",
      });
    }

    // Find application and populate related data
    const application = await Application.findById(applicationId)
      .populate("job")
      .populate("developer", "username email");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    // Make sure the application has a valid job
    if (!application.job) {
      return res.status(404).json({
        success: false,
        message: "The job associated with this application no longer exists.",
      });
    }

    // Only the client who owns the job can accept/reject applications
    if (application.job.client.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this application.",
      });
    }

    // Prevent changing an already processed application
    if (application.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Application has already been ${application.status}.`,
      });
    }

    // --------------------------------------------------
    // REJECT APPLICATION
    // --------------------------------------------------
      if (status === "rejected") {
        application.status = "rejected";
        await application.save();

        await sendRejectionEmail({
          email: application.developer.email,
          developerName: application.developer.username,
          jobTitle: application.job.title,
        });

      const message =
        "Your application has been rejected.";

      // Prevent duplicate notification
      const notificationExists = await Notification.findOne({
        user: application.developer._id,
        message,
      });

      if (!notificationExists) {
        await Notification.create({
          user: application.developer._id,
          message,
        });
      }

      await sendRejectionEmail(application.developer.email, application.job.title);

      return res.status(200).json({
        success: true,
        message: "Application rejected successfully.",
        application,
      });
    }

    // --------------------------------------------------
    // ACCEPT APPLICATION
    // --------------------------------------------------

    // First accept the selected developer
    application.status = "accepted";
    await application.save();

    // Reject all other pending applicants for this job
    const otherApplications = await Application.find({
      job: application.job._id,
      _id: { $ne: application._id },
      status: "pending",
    }).populate("developer", "username email");

    await Application.updateMany(
      {
        job: application.job._id,
        _id: { $ne: application._id },
        status: "pending",
      },
      {
        $set: {
          status: "rejected",
        },
      }
    );

    // Notify developers who were automatically rejected
    for (const otherApplication of otherApplications) {
      const rejectionMessage =
        `Your application for "${application.job.title}" has been rejected because another developer was selected.`;

      await Notification.create({
        user: otherApplication.developer._id,
        message: rejectionMessage,
      });

      await sendRejectionEmail({
        email: otherApplication.developer.email,
        developerName: otherApplication.developer.username,
        jobTitle: application.job.title,
      });
    }

   
    // CREATE ONE CONTRACT ONLY

    // Prevent duplicate contract creation
    const existingContract = await Contract.findOne({
      application: application._id,
    });

    if (!existingContract) {
      const commission = calculateCommission(
        application.job.budget
      );

      const developerAmount =
        application.job.budget - commission;

      await Contract.create({
        application: application._id,
        job: application.job._id,
        client: application.job.client,
        developer: application.developer._id,
        amount: application.job.budget,
        commission,
        developerAmount,
      });
    }

    // --------------------------------------------------
    // NOTIFY ACCEPTED DEVELOPER
    // --------------------------------------------------

    const acceptanceMessage =
      "Congratulations! Your application has been accepted.";

    const notificationExists = await Notification.findOne({
      user: application.developer._id,
      message: acceptanceMessage,
    });

    if (!notificationExists) {
      await Notification.create({
        user: application.developer._id,
        message: acceptanceMessage,
      });
    }

    // --------------------------------------------------
    // SEND ACCEPTANCE EMAIL
    // --------------------------------------------------

    await sendAcceptanceEmail({
      email: application.developer.email,
      developerName: application.developer.username,
      jobTitle: application.job.title,
    });

    return res.status(200).json({
      success: true,
      message: "Developer accepted successfully.",
      application,
    });
  } catch (error) {
    console.error("Update application status error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};