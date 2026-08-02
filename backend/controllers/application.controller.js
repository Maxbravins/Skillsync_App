import Application from "../models/application.model.js";
import Job from "../models/job.model.js";
import Notification from "../models/notification.model.js";
import { sendApplicationEmail, sendAcceptanceEmail } from "../services/email.service.js";
import Contract from "../models/contract.model.js";
import { calculateCommission } from "../services/platformFee.service.js";

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
    const applications = await Application.find({
      job: req.params.jobId,
    })
      .populate("developer", "username email")
      .populate("job", "title");

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

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const application = await Application.findById(
      req.params.applicationId
    )
      .populate("job")
      .populate("developer", "username email");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Prevent updating an application that is already finalized
    if (application.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Application has already been ${application.status}.`,
      });
    }

    application.status = status;
    await application.save();
    
    if (status === "accepted") {

    const commission = application.job.budget * 0.10;

    const developerAmount = application.job.budget - commission;

    await Contract.create({

        job: application.job._id,

        application: application._id,

        client: application.job.client,

        developer: application.developer._id,

        amount: application.job.budget,

        commission,

        developerAmount,

    });

}

    // If one developer is accepted, reject every other pending applicant
    if (status === "accepted") {
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

    // Prevent duplicate notifications
    const message =
      status === "accepted"
        ? "Congratulations! Your application has been accepted."
        : "Your application has been rejected.";

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

    // Send acceptance email only once
    if (status === "accepted") {
      await sendAcceptanceEmail({
        email: application.developer.email,
        developerName: application.developer.username,
        jobTitle: application.job.title,
      });
    }

    res.status(200).json({
      success: true,
      message: "Application status updated successfully",
      application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};