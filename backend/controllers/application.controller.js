import Application from "../models/application.model.js";
import Job from "../models/job.model.js";
import Notification from "../models/notification.model.js";
import { sendApplicationEmail, sendAcceptanceEmail } from "../services/email.service.js";

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

    const application = await Application.findById(
      req.params.applicationId
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    application.status = status;
        await application.save();

        await application.populate("job", "title");
        await application.populate("developer", "username email");

        // Create notification
        await Notification.create({
          user: application.developer._id,
          message:
            status === "accepted"
              ? "Congratulations! Your application has been accepted."
              : "Your application has been rejected.",
        });

        // Send email only if accepted
        if (status === "accepted") {
          await sendAcceptanceEmail({
            email: application.developer.email,
            developerName: application.developer.username,
            jobTitle: application.job.title,
          });
        }

    res.status(200).json({
      success: true,
      message: "Application status updated",
      application,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};