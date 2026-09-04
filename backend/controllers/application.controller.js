import Application from "../models/application.model.js";
import Job from "../models/job.model.js";
import Notification from "../models/notification.model.js";
import Contract from "../models/contract.model.js";

import {
  sendApplicationEmail,
  sendAcceptanceEmail,
  sendRejectionEmail,
} from "../services/email.service.js";

import {
  calculateCommission,
  calculateDeveloperAmount,
} from "../services/platformFee.service.js";

// ============================================================
// HELPERS
// ============================================================

const createNotification = async (userId, message) => {
  try {
    const existingNotification =
      await Notification.findOne({
        user: userId,
        message,
      });

    if (existingNotification) {
      return existingNotification;
    }

    return await Notification.create({
      user: userId,
      message,
    });
  } catch (error) {
    console.error(
      "Notification creation error:",
      error
    );

    // Notification failure should not break
    // the main application operation.
    return null;
  }
};

const safeSendEmail = async (emailFunction, data) => {
  try {
    await emailFunction(data);
  } catch (error) {
    console.error(
      "Application email error:",
      error
    );

    // Email failure should not make the
    // database operation fail.
  }
};

// ============================================================
// APPLY FOR JOB
// ============================================================

export const applyForJob = async (req, res) => {
  try {
    const {
      coverLetter,
      proposedBudget,
      proposedTimeline,
      attachments = [],
    } = req.body;

    const { jobId } = req.params;

    // --------------------------------------------------------
    // VALIDATE REQUIRED FIELDS
    // --------------------------------------------------------

    if (!coverLetter?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Cover letter is required.",
      });
    }

    if (
      proposedBudget === undefined ||
      proposedBudget === null ||
      Number(proposedBudget) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A valid proposed budget is required.",
      });
    }

    if (!Array.isArray(attachments)) {
      return res.status(400).json({
        success: false,
        message: "Attachments must be an array.",
      });
    }

    // --------------------------------------------------------
    // FIND JOB
    // --------------------------------------------------------

    const job = await Job.findById(jobId).populate(
      "client",
      "username email"
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    // --------------------------------------------------------
    // JOB STATUS
    // --------------------------------------------------------

    if (job.status !== "Open" || !job.isPublished) {
      return res.status(400).json({
        success: false,
        message:
          "This job is not currently accepting applications.",
      });
    }

    // --------------------------------------------------------
    // APPLICATION DEADLINE
    // --------------------------------------------------------

    if (
      job.applicationDeadline &&
      new Date(job.applicationDeadline) <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The application deadline for this job has passed.",
      });
    }

    // --------------------------------------------------------
    // CLIENT CANNOT APPLY TO OWN JOB
    // --------------------------------------------------------

    if (
      job.client._id.toString() ===
      req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot apply to your own job.",
      });
    }

    // --------------------------------------------------------
    // PREVENT DUPLICATE APPLICATION
    // --------------------------------------------------------

    const existingApplication =
      await Application.findOne({
        developer: req.user.id,
        job: job._id,
      });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message:
          "You have already applied for this job.",
        application: existingApplication,
      });
    }

    // --------------------------------------------------------
    // VALIDATE PROPOSED BUDGET
    // --------------------------------------------------------

    const numericProposedBudget =
      Number(proposedBudget);

    if (!Number.isFinite(numericProposedBudget)) {
      return res.status(400).json({
        success: false,
        message:
          "Proposed budget must be a valid number.",
      });
    }

    // --------------------------------------------------------
    // CREATE APPLICATION
    // --------------------------------------------------------

    const application =
      await Application.create({
        developer: req.user.id,
        job: job._id,
        coverLetter: coverLetter.trim(),
        proposedBudget:
          Math.round(
            numericProposedBudget * 100
          ) / 100,
        proposedTimeline:
          proposedTimeline?.trim() || "",
        attachments,
        status: "pending",
        paymentStatus: "unpaid",
      });

    // --------------------------------------------------------
    // UPDATE APPLICATION COUNT
    // --------------------------------------------------------

    await Job.findByIdAndUpdate(
      job._id,
      {
        $inc: {
          applicationCount: 1,
        },
      }
    );

    // --------------------------------------------------------
    // POPULATE APPLICATION
    // --------------------------------------------------------

    await application.populate([
      {
        path: "developer",
        select: "username email",
      },
      {
        path: "job",
        select:
          "title description budget currency status",
      },
    ]);

    // --------------------------------------------------------
    // NOTIFY CLIENT
    // --------------------------------------------------------

    const notificationMessage =
      `${application.developer.username} applied for your job "${job.title}".`;

    await createNotification(
      job.client._id,
      notificationMessage
    );

    // --------------------------------------------------------
    // SEND EMAIL TO CLIENT
    // --------------------------------------------------------

    await safeSendEmail(
      sendApplicationEmail,
      {
        email: job.client.email,
        clientName:
          job.client.username,
        developerName:
          application.developer
            .username,
        jobTitle: job.title,
      }
    );

    return res.status(201).json({
      success: true,
      message:
        "Application submitted successfully.",
      application,
    });
  } catch (error) {
    console.error(
      "Apply for job error:",
      error
    );

    // Duplicate key protection.
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "You have already applied for this job.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to submit application.",
    });
  }
};

// ============================================================
// GET APPLICATIONS FOR A SPECIFIC JOB
// ============================================================

export const getJobApplications = async (
  req,
  res
) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    // Only job owner can view applications.
    if (
      job.client.toString() !==
      req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to view these applications.",
      });
    }

    const applications =
      await Application.find({
        job: jobId,
      })
        .populate(
          "developer",
          "username email"
        )
        .populate(
          "job",
          "title description budget currency"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error(
      "Get job applications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to retrieve applications.",
    });
  }
};

// ============================================================
// GET MY APPLICATIONS
// ============================================================

export const getMyApplications = async (
  req,
  res
) => {
  try {
    const applications =
      await Application.find({
        developer: req.user.id,
      })
        .populate(
          "job",
          "title description budget currency status paymentStatus"
        )
        .populate(
          "developer",
          "username email"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error(
      "Get my applications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to retrieve your applications.",
    });
  }
};

// ============================================================
// GET ALL APPLICATIONS FOR CLIENT
// ============================================================

export const getClientApplications =
  async (req, res) => {
    try {
      const jobs = await Job.find({
        client: req.user.id,
      }).select("_id");

      const jobIds = jobs.map(
        (job) => job._id
      );

      if (jobIds.length === 0) {
        return res.status(200).json({
          success: true,
          count: 0,
          applications: [],
        });
      }

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
            "title description budget currency status"
          )
          .populate(
            "contract"
          )
          .sort({
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,
        count: applications.length,
        applications,
      });
    } catch (error) {
      console.error(
        "Get client applications error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to retrieve applications.",
      });
    }
  };

// ============================================================
// UPDATE APPLICATION STATUS
// ============================================================

export const updateApplicationStatus =
  async (req, res) => {
    try {
      const { status } = req.body;
      const { applicationId } = req.params;

      // ------------------------------------------------------
      // VALIDATE STATUS
      // ------------------------------------------------------

      if (
        !["accepted", "rejected"].includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Status must be either accepted or rejected.",
        });
      }

      // ------------------------------------------------------
      // FIND APPLICATION
      // ------------------------------------------------------

      const application =
        await Application.findById(
          applicationId
        )
          .populate({
            path: "job",
            populate: {
              path: "client",
              select: "username email",
            },
          })
          .populate(
            "developer",
            "username email"
          );

      if (!application) {
        return res.status(404).json({
          success: false,
          message:
            "Application not found.",
        });
      }

      if (!application.job) {
        return res.status(404).json({
          success: false,
          message:
            "The job associated with this application no longer exists.",
        });
      }

      // ------------------------------------------------------
      // AUTHORIZATION
      // ------------------------------------------------------

      if (
        application.job.client._id.toString() !==
        req.user.id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to update this application.",
        });
      }

      // ------------------------------------------------------
      // PREVENT PROCESSING ALREADY PROCESSED APPLICATION
      // ------------------------------------------------------

      if (
        application.status !== "pending" &&
        application.status !== "reviewed" &&
        application.status !== "shortlisted"
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Application has already been ${application.status}.`,
        });
      }

      // ------------------------------------------------------
      // REJECT APPLICATION
      // ------------------------------------------------------

      if (status === "rejected") {
        application.status = "rejected";
        application.reviewedAt = new Date();

        await application.save();

        const rejectionMessage =
          `Your application for "${application.job.title}" has been rejected.`;

        await createNotification(
          application.developer._id,
          rejectionMessage
        );

        await safeSendEmail(
          sendRejectionEmail,
          {
            email:
              application
                .developer.email,

            developerName:
              application
                .developer
                .username,

            jobTitle:
              application.job.title,
          }
        );

        return res.status(200).json({
          success: true,
          message:
            "Application rejected successfully.",
          application,
        });
      }

      // ------------------------------------------------------
      // ACCEPT APPLICATION
      // ------------------------------------------------------

      // Check whether another developer has
      // already been accepted for this job.
      const alreadyAccepted =
        await Application.findOne({
          job: application.job._id,
          status: "accepted",
          _id: {
            $ne: application._id,
          },
        });

      if (alreadyAccepted) {
        return res.status(400).json({
          success: false,
          message:
            "Another developer has already been accepted for this job.",
        });
      }

      // ------------------------------------------------------
      // ACCEPT SELECTED APPLICATION
      // ------------------------------------------------------

      application.status = "accepted";
      application.acceptedAt = new Date();
      application.reviewedAt = new Date();

      await application.save();

      // ------------------------------------------------------
      // ASSIGN DEVELOPER TO JOB
      // ------------------------------------------------------

      const job = await Job.findById(
        application.job._id
      );

      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found.",
        });
      }

      job.hiredDeveloper =
        application.developer._id;

      // If payment has not happened yet,
      // keep the job in Filled state.
      if (
        job.status === "Open" ||
        job.status === "Filled"
      ) {
        job.status = "Filled";
      }

      await job.save();

      // ------------------------------------------------------
      // REJECT OTHER PENDING APPLICATIONS
      // ------------------------------------------------------

      const otherApplications =
        await Application.find({
          job: application.job._id,
          _id: {
            $ne: application._id,
          },
          status: {
            $in: [
              "pending",
              "reviewed",
              "shortlisted",
            ],
          },
        }).populate(
          "developer",
          "username email"
        );

      await Application.updateMany(
        {
          job: application.job._id,
          _id: {
            $ne: application._id,
          },
          status: {
            $in: [
              "pending",
              "reviewed",
              "shortlisted",
            ],
          },
        },
        {
          $set: {
            status: "rejected",
            reviewedAt: new Date(),
          },
        }
      );

      // ------------------------------------------------------
      // NOTIFY OTHER DEVELOPERS
      // ------------------------------------------------------

      for (const otherApplication of otherApplications) {
        if (!otherApplication.developer) {
          continue;
        }

        const rejectionMessage =
          `Your application for "${application.job.title}" has been rejected because another developer was selected.`;

        await createNotification(
          otherApplication
            .developer
            ._id,
          rejectionMessage
        );

        await safeSendEmail(
          sendRejectionEmail,
          {
            email:
              otherApplication
                .developer
                .email,

            developerName:
              otherApplication
                .developer
                .username,

            jobTitle:
              application.job.title,
          }
        );
      }

      // ------------------------------------------------------
      // CREATE CONTRACT
      // ------------------------------------------------------

      let contract =
        await Contract.findOne({
          application:
            application._id,
        });

      if (!contract) {
        const commission =
          calculateCommission(
            application.job.budget
          );

        const developerAmount =
          calculateDeveloperAmount(
            application.job.budget
          );

        contract =
          await Contract.create({
            application:
              application._id,

            job:
              application.job._id,

            client:
              application.job.client._id,

            developer:
              application.developer._id,

            amount:
              application.job.budget,

            commission,

            developerAmount,
          });
      }

      // LINK CONTRACT TO APPLICATION
      if (
        !application.contract ||
        application.contract.toString() !==
          contract._id.toString()
      ) {
        application.contract =
          contract._id;

        await application.save();
      }

      // ------------------------------------------------------
      // ACCEPTED DEVELOPER NOTIFICATION
      // ------------------------------------------------------

      const acceptanceMessage =
        "Congratulations! Your application has been accepted.";

      await createNotification(
        application.developer._id,
        acceptanceMessage
      );

      // ------------------------------------------------------
      // ACCEPTANCE EMAIL
      // ------------------------------------------------------

      await safeSendEmail(
        sendAcceptanceEmail,
        {
          email:
            application.developer
              .email,

          developerName:
            application.developer
              .username,

          jobTitle:
            application.job.title,
        }
      );

      // ------------------------------------------------------
      // RETURN UPDATED DATA
      // ------------------------------------------------------

      await application.populate([
        {
          path: "job",
          select:
            "title description budget currency status paymentStatus hiredDeveloper",
        },
        {
          path: "developer",
          select: "username email",
        },
        {
          path: "contract",
        },
      ]);

      return res.status(200).json({
        success: true,
        message:
          "Developer accepted successfully.",
        application,
        contract,
        job,
      });
    } catch (error) {
      console.error(
        "Update application status error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to update application status.",
      });
    }
  };
