import mongoose from "mongoose";

import Application from "../models/application.model.js";
import Job from "../models/job.model.js";
import User from "../models/user.model.js";

import notificationService from "./notification.service.js";

import {
  sendApplicationEmail,
  sendAcceptanceEmail,
  sendRejectionEmail,
} from "./email.service.js";

class ApplicationService {
  // ============================================================
  // CREATE APPLICATION
  // ============================================================

  async createApplication({
    jobId,
    developerId,
    coverLetter = "",
    proposedAmount = null,
    estimatedDuration = "",
  }) {
    const session =
      await mongoose.startSession();

    try {
      let result;

      await session.withTransaction(
        async () => {
          const job =
            await Job.findById(jobId)
              .session(session);

          if (!job) {
            throw new Error(
              "Job not found"
            );
          }

          /*
           * Only published/open jobs should
           * receive applications.
           */

          if (
            job.status !== "Open" ||
            !job.isPublished
          ) {
            throw new Error(
              "This job is not accepting applications"
            );
          }

          /*
           * Client cannot apply to own job.
           */

          if (
            job.client.toString() ===
            developerId.toString()
          ) {
            throw new Error(
              "You cannot apply to your own job"
            );
          }

          /*
           * Check application deadline.
           */

          if (
            job.applicationDeadline &&
            new Date() >
              new Date(
                job.applicationDeadline
              )
          ) {
            throw new Error(
              "Application deadline has passed"
            );
          }

          /*
           * Developer must exist.
           */

          const developer =
            await User.findById(
              developerId
            ).session(session);

          if (!developer) {
            throw new Error(
              "Developer not found"
            );
          }

          /*
           * Prevent duplicate applications.
           */

          const existingApplication =
            await Application.findOne({
              job: job._id,
              developer: developer._id,
            }).session(session);

          if (existingApplication) {
            throw new Error(
              "You have already applied for this job"
            );
          }

          /*
           * Validate proposed amount.
           *
           * If omitted, use job budget.
           */

          const amount =
            proposedAmount !== null &&
            proposedAmount !== undefined
              ? Number(proposedAmount)
              : job.budget;

          if (
            !Number.isFinite(amount) ||
            amount <= 0
          ) {
            throw new Error(
              "Proposed amount must be greater than zero"
            );
          }

          /*
           * Create application.
           */

          const application =
            new Application({
              job: job._id,

              developer:
                developer._id,

              client:
                job.client,

              coverLetter:
                coverLetter.trim(),

              proposedAmount:
                amount,

              estimatedDuration,

              status: "pending",
            });

          await application.save({
            session,
          });

          /*
           * Update cached application count.
           */

          job.applicationCount =
            (job.applicationCount || 0) + 1;

          await job.save({
            session,
          });

          result = application;
        }
      );

      /*
       * Notifications happen AFTER the database
       * transaction has successfully committed.
       */

      await this.notifyClientOfApplication(
        result
      );

      return result;
    } finally {
      await session.endSession();
    }
  }

  // ============================================================
  // GET APPLICATION
  // ============================================================

  async getApplication(
    applicationId,
    userId = null
  ) {
    const application =
      await Application.findById(
        applicationId
      )
        .populate(
          "developer",
          "username email profileImage skills"
        )
        .populate(
          "client",
          "username email"
        )
        .populate(
          "job",
          "title description budget currency status client hiredDeveloper"
        )
        .lean();

    if (!application) {
      throw new Error(
        "Application not found"
      );
    }

    /*
     * If userId is supplied, ensure the user
     * belongs to the application.
     */

    if (userId) {
      const isDeveloper =
        application.developer?._id
          ?.toString() ===
        userId.toString();

      const isClient =
        application.client?._id
          ?.toString() ===
        userId.toString();

      if (
        !isDeveloper &&
        !isClient
      ) {
        throw new Error(
          "You are not authorized to view this application"
        );
      }
    }

    return application;
  }

  // ============================================================
  // GET DEVELOPER APPLICATIONS
  // ============================================================

  async getDeveloperApplications({
    developerId,
    status = null,
    page = 1,
    limit = 20,
  }) {
    const currentPage =
      Math.max(Number(page), 1);

    const pageLimit = Math.min(
      Math.max(Number(limit), 1),
      100
    );

    const query = {
      developer: developerId,
    };

    if (status) {
      query.status = status;
    }

    const [
      applications,
      total,
    ] = await Promise.all([
      Application.find(query)
        .populate(
          "job",
          "title budget currency status paymentStatus projectType experienceLevel"
        )
        .populate(
          "client",
          "username email"
        )
        .sort({
          createdAt: -1,
        })
        .skip(
          (currentPage - 1) *
            pageLimit
        )
        .limit(pageLimit)
        .lean(),

      Application.countDocuments(
        query
      ),
    ]);

    return {
      applications,

      pagination: {
        page: currentPage,

        limit: pageLimit,

        total,

        pages: Math.ceil(
          total / pageLimit
        ),
      },
    };
  }

  // ============================================================
  // GET CLIENT APPLICATIONS
  // ============================================================

  async getClientApplications({
    clientId,
    jobId = null,
    status = null,
    page = 1,
    limit = 20,
  }) {
    const currentPage =
      Math.max(Number(page), 1);

    const pageLimit = Math.min(
      Math.max(Number(limit), 1),
      100
    );

    const query = {
      client: clientId,
    };

    if (jobId) {
      query.job = jobId;
    }

    if (status) {
      query.status = status;
    }

    const [
      applications,
      total,
    ] = await Promise.all([
      Application.find(query)
        .populate(
          "developer",
          "username email profileImage skills bio"
        )
        .populate(
          "job",
          "title budget currency status paymentStatus"
        )
        .sort({
          createdAt: -1,
        })
        .skip(
          (currentPage - 1) *
            pageLimit
        )
        .limit(pageLimit)
        .lean(),

      Application.countDocuments(
        query
      ),
    ]);

    return {
      applications,

      pagination: {
        page: currentPage,

        limit: pageLimit,

        total,

        pages: Math.ceil(
          total / pageLimit
        ),
      },
    };
  }

  // ============================================================
  // GET APPLICATIONS FOR A JOB
  // ============================================================

  async getJobApplications({
    jobId,
    clientId,
    status = null,
    page = 1,
    limit = 20,
  }) {
    const job =
      await Job.findById(jobId)
        .select("client")
        .lean();

    if (!job) {
      throw new Error(
        "Job not found"
      );
    }

    if (
      job.client.toString() !==
      clientId.toString()
    ) {
      throw new Error(
        "You are not authorized to view these applications"
      );
    }

    return this.getClientApplications(
      {
        clientId,
        jobId,
        status,
        page,
        limit,
      }
    );
  }

  // ============================================================
  // WITHDRAW APPLICATION
  // ============================================================

  async withdrawApplication({
    applicationId,
    developerId,
  }) {
    const session =
      await mongoose.startSession();

    try {
      let application;

      await session.withTransaction(
        async () => {
          application =
            await Application.findOne({
              _id: applicationId,
              developer: developerId,
            }).session(session);

          if (!application) {
            throw new Error(
              "Application not found"
            );
          }

          if (
            application.status !==
            "pending"
          ) {
            throw new Error(
              `Cannot withdraw an application with status "${application.status}"`
            );
          }

          application.status =
            "withdrawn";

          application.withdrawnAt =
            new Date();

          await application.save({
            session,
          });
        }
      );

      return application;
    } finally {
      await session.endSession();
    }
  }

  // ============================================================
  // ACCEPT APPLICATION
  // ============================================================

  async acceptApplication({
    applicationId,
    clientId,
  }) {
    const session =
      await mongoose.startSession();

    try {
      let result;

      await session.withTransaction(
        async () => {
          const application =
            await Application.findById(
              applicationId
            ).session(session);

          if (!application) {
            throw new Error(
              "Application not found"
            );
          }

          /*
           * Load job.
           */

          const job =
            await Job.findById(
              application.job
            ).session(session);

          if (!job) {
            throw new Error(
              "Job not found"
            );
          }

          /*
           * Verify client ownership.
           */

          if (
            job.client.toString() !==
            clientId.toString()
          ) {
            throw new Error(
              "You are not authorized to accept this application"
            );
          }

          /*
           * Job must still be available.
           */

          if (
            ![
              "Open",
              "Filled",
            ].includes(job.status)
          ) {
            throw new Error(
              `Cannot accept an application for a job with status "${job.status}"`
            );
          }

          /*
           * Application must still be pending.
           */

          if (
            application.status !==
            "pending"
          ) {
            throw new Error(
              `Cannot accept an application with status "${application.status}"`
            );
          }

          /*
           * Prevent hiring another developer.
           */

          if (
            job.hiredDeveloper &&
            job.hiredDeveloper.toString() !==
              application.developer.toString()
          ) {
            throw new Error(
              "A developer has already been hired for this job"
            );
          }

          /*
           * Accept application.
           */

          application.status =
            "accepted";

          application.acceptedAt =
            new Date();

          await application.save({
            session,
          });

          /*
           * Assign developer to job.
           */

          job.hiredDeveloper =
            application.developer;

          job.status =
            "Filled";

          await job.save({
            session,
          });

          /*
           * Reject all other pending applications.
           */

          await Application.updateMany(
            {
              job: job._id,

              _id: {
                $ne: application._id,
              },

              status: "pending",
            },
            {
              $set: {
                status:
                  "rejected",

                rejectedAt:
                  new Date(),

                rejectionReason:
                  "Another developer was selected for this project",
              },
            },
            {
              session,
            }
          );

          result = {
            application,
            job,
          };
        }
      );

      /*
       * Notify accepted developer.
       */

      await this.notifyAcceptedDeveloper(
        result.application,
        result.job
      );

      /*
       * Notify rejected developers separately.
       *
       * We fetch them after commit because the update
       * above intentionally rejected the remaining applications.
       */

      await this.notifyRejectedApplications(
        result.job._id,
        result.application._id
      );

      return result;
    } finally {
      await session.endSession();
    }
  }

  // ============================================================
  // REJECT APPLICATION
  // ============================================================

  async rejectApplication({
    applicationId,
    clientId,
    reason = "Application was not selected",
  }) {
    const session =
      await mongoose.startSession();

    try {
      let result;

      await session.withTransaction(
        async () => {
          const application =
            await Application.findById(
              applicationId
            ).session(session);

          if (!application) {
            throw new Error(
              "Application not found"
            );
          }

          const job =
            await Job.findById(
              application.job
            ).session(session);

          if (!job) {
            throw new Error(
              "Job not found"
            );
          }

          if (
            job.client.toString() !==
            clientId.toString()
          ) {
            throw new Error(
              "You are not authorized to reject this application"
            );
          }

          if (
            application.status !==
            "pending"
          ) {
            throw new Error(
              `Cannot reject an application with status "${application.status}"`
            );
          }

          application.status =
            "rejected";

          application.rejectedAt =
            new Date();

          application.rejectionReason =
            reason;

          await application.save({
            session,
          });

          result = {
            application,
            job,
          };
        }
      );

      await this.notifyRejectedDeveloper(
        result.application,
        result.job
      );

      return result;
    } finally {
      await session.endSession();
    }
  }

  // ============================================================
  // CHECK APPLICATION STATUS
  // ============================================================

  async getApplicationStatus({
    jobId,
    developerId,
  }) {
    const application =
      await Application.findOne({
        job: jobId,
        developer: developerId,
      })
        .select(
          "_id status proposedAmount createdAt acceptedAt rejectedAt withdrawnAt"
        )
        .lean();

    return application;
  }

  // ============================================================
  // APPLICATION STATISTICS
  // ============================================================

  async getJobApplicationStats(
    jobId,
    clientId
  ) {
    const job =
      await Job.findById(jobId)
        .select("client")
        .lean();

    if (!job) {
      throw new Error(
        "Job not found"
      );
    }

    if (
      job.client.toString() !==
      clientId.toString()
    ) {
      throw new Error(
        "You are not authorized to view these statistics"
      );
    }

    const stats =
      await Application.aggregate([
        {
          $match: {
            job:
              new mongoose.Types.ObjectId(
                jobId
              ),
          },
        },

        {
          $group: {
            _id: "$status",

            count: {
              $sum: 1,
            },
          },
        },
      ]);

    const result = {
      total: 0,

      pending: 0,

      accepted: 0,

      rejected: 0,

      withdrawn: 0,
    };

    for (const item of stats) {
      result[item._id] =
        item.count;

      result.total +=
        item.count;
    }

    return result;
  }

  // ============================================================
  // NOTIFICATIONS
  // ============================================================

  async notifyClientOfApplication(
    application
  ) {
    try {
      const populated =
        await Application.findById(
          application._id
        )
          .populate(
            "developer",
            "username email"
          )
          .populate(
            "client",
            "username email"
          )
          .populate(
            "job",
            "title"
          )
          .lean();

      if (!populated) {
        return;
      }

      const client =
        populated.client;

      const developer =
        populated.developer;

      const job =
        populated.job;

      /*
       * In-app notification.
       */

      if (
        typeof notificationService?.createNotification ===
        "function"
      ) {
        await notificationService.createNotification(
          {
            userId: client._id,

            message:
              `${developer?.username || "A developer"} submitted an application for "${job?.title || "your job"}".`,
          }
        );
      }

      /*
       * Email notification.
       */

      if (client.email) {
        await sendApplicationEmail({
          email: client.email,

          clientName:
            client.username ||
            "Client",

          developerName:
            developer?.username ||
            "Developer",

          jobTitle:
            job?.title ||
            "your job",
        });
      }
    } catch (error) {
      /*
       * Notification failure should never
       * roll back a successful application.
       */

      console.error(
        "Application notification error:",
        error
      );
    }
  }

  // ============================================================
  // ACCEPTED DEVELOPER NOTIFICATION
  // ============================================================

  async notifyAcceptedDeveloper(
    application,
    job
  ) {
    try {
      const developer =
        await User.findById(
          application.developer
        ).select(
          "username email"
        );

      if (!developer) {
        return;
      }

      if (
        typeof notificationService?.createNotification ===
        "function"
      ) {
        await notificationService.createNotification(
          {
            userId:
              developer._id,

            message:
              `Congratulations! Your application for "${job.title}" has been accepted.`,
          }
        );
      }

      if (developer.email) {
        await sendAcceptanceEmail({
          email:
            developer.email,

          developerName:
            developer.username ||
            "Developer",

          jobTitle:
            job.title,
        });
      }
    } catch (error) {
      console.error(
        "Application acceptance notification error:",
        error
      );
    }
  }

  // ============================================================
  // REJECTED DEVELOPER NOTIFICATION
  // ============================================================

  async notifyRejectedDeveloper(
    application,
    job
  ) {
    try {
      const developer =
        await User.findById(
          application.developer
        ).select(
          "username email"
        );

      if (!developer) {
        return;
      }

      if (
        typeof notificationService?.createNotification ===
        "function"
      ) {
        await notificationService.createNotification(
          {
            userId:
              developer._id,

            message:
              `Your application for "${job.title}" was not selected.`,
          }
        );
      }

      if (developer.email) {
        await sendRejectionEmail({
          email:
            developer.email,

          developerName:
            developer.username ||
            "Developer",

          jobTitle:
            job.title,
        });
      }
    } catch (error) {
      console.error(
        "Application rejection notification error:",
        error
      );
    }
  }

  // ============================================================
  // NOTIFY ALL OTHER REJECTED DEVELOPERS
  // ============================================================

  async notifyRejectedApplications(
    jobId,
    acceptedApplicationId
  ) {
    try {
      const applications =
        await Application.find({
          job: jobId,

          status: "rejected",

          _id: {
            $ne: acceptedApplicationId,
          },
        })
          .populate(
            "developer",
            "username email"
          )
          .lean();

      const job =
        await Job.findById(jobId)
          .select("title")
          .lean();

      if (!job) {
        return;
      }

       // Send notifications sequentially to avoid overwhelming the email provider.
          for (const application of applications) {
        if (!application.developer) {
          continue;
        }

        await this.notifyRejectedDeveloper(
          application,
          job
        );
      }
    } catch (error) {
      console.error(
        "Bulk application rejection notification error:",
        error
      );
    }
  }
}

export default new ApplicationService();
