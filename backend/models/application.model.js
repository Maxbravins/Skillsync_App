import mongoose from "mongoose";

import Application from "../models/application.model.js";
import Job from "../models/job.model.js";
import Notification from "../models/notification.model.js";

import {
  sendApplicationEmail,
  sendAcceptanceEmail,
  sendRejectionEmail,
} from "../services/email.service.js";

class ApplicationService {
  // ============================================================
  // CREATE APPLICATION
  // ============================================================

  async createApplication({
    jobId,
    developerId,
    coverLetter,
    proposedBudget,
    proposedTimeline = "",
    attachments = [],
  }) {
    const session = await mongoose.startSession();

    try {
      let result;

      await session.withTransaction(async () => {
        if (!coverLetter?.trim()) {
          throw new Error("Cover letter is required");
        }

        if (
          proposedBudget === undefined ||
          proposedBudget === null ||
          Number(proposedBudget) <= 0
        ) {
          throw new Error(
            "Proposed budget must be greater than zero"
          );
        }

        const job = await Job.findById(jobId).session(session);

        if (!job) {
          throw new Error("Job not found");
        }

        // Developer cannot apply to own job.
        if (
          job.client &&
          job.client.toString() === developerId.toString()
        ) {
          throw new Error(
            "You cannot apply to your own job"
          );
        }

        // Only published/open jobs should accept applications.
        if (
          job.status !== "Open" ||
          !job.isPublished
        ) {
          throw new Error(
            "This job is not currently accepting applications"
          );
        }

        // Application deadline check.
        if (
          job.applicationDeadline &&
          new Date(job.applicationDeadline) <= new Date()
        ) {
          throw new Error(
            "The application deadline has passed"
          );
        }

        // Once a developer has been hired, do not accept
        // additional applications.
        if (job.hiredDeveloper) {
          throw new Error(
            "A developer has already been hired for this job"
          );
        }

        // Prevent duplicate applications.
        const existingApplication =
          await Application.findOne({
            job: job._id,
            developer: developerId,
          }).session(session);

        if (existingApplication) {
          throw new Error(
            "You have already applied for this job"
          );
        }

        // Validate attachments.
        if (!Array.isArray(attachments)) {
          throw new Error(
            "Attachments must be an array"
          );
        }

        const application =
          new Application({
            developer: developerId,

            job: job._id,

            coverLetter:
              coverLetter.trim(),

            proposedBudget:
              Number(proposedBudget),

            proposedTimeline:
              proposedTimeline?.trim() || "",

            attachments,

            status: "pending",

            paymentStatus: "unpaid",
          });

        await application.save({ session });

        // Keep job analytics synchronized.
        job.applicationCount =
          (job.applicationCount || 0) + 1;

        await job.save({ session });

        result = {
          application,
          job,
        };
      });

      /*
       * Notifications/emails are intentionally sent after
       * the database transaction succeeds.
       *
       * This prevents a notification from being sent when
       * the application transaction eventually rolls back.
       */
      if (result?.application) {
        await this.notifyNewApplication(
          result.application,
          result.job
        );
      }

      return result.application;
    } finally {
      await session.endSession();
    }
  }

  // ============================================================
  // GET APPLICATION BY ID
  // ============================================================

  async getApplicationById(
    applicationId,
    userId = null
  ) {
    const application =
      await Application.findById(applicationId)
        .populate(
          "developer",
          "username email profileImage skills"
        )
        .populate(
          "job",
          "title description budget currency status client hiredDeveloper"
        )
        .populate(
          "transaction"
        )
        .populate(
          "contract"
        )
        .lean();

    if (!application) {
      throw new Error("Application not found");
    }

    // Optional authorization.
    if (userId) {
      const isDeveloper =
        application.developer?._id?.toString() ===
        userId.toString();

      const isClient =
        application.job?.client?.toString() ===
        userId.toString();

      if (!isDeveloper && !isClient) {
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

  async getDeveloperApplications(
    developerId,
    {
      status = null,
      page = 1,
      limit = 20,
    } = {}
  ) {
    const safePage =
      Math.max(Number(page) || 1, 1);

    const safeLimit = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    const skip =
      (safePage - 1) * safeLimit;

    const filter = {
      developer: developerId,
    };

    if (status) {
      filter.status = status;
    }

    const [applications, total] =
      await Promise.all([
        Application.find(filter)
          .populate(
            "job",
            "title description budget minBudget maxBudget currency status paymentStatus applicationDeadline projectDeadline client"
          )
          .populate(
            "contract"
          )
          .populate(
            "transaction"
          )
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(safeLimit)
          .lean(),

        Application.countDocuments(filter),
      ]);

    return {
      applications,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(
          total / safeLimit
        ),
      },
    };
  }

  // ============================================================
  // GET JOB APPLICATIONS
  // ============================================================

  async getJobApplications(
    jobId,
    clientId,
    {
      status = null,
      page = 1,
      limit = 20,
    } = {}
  ) {
    const job =
      await Job.findById(jobId)
        .select("client title status")
        .lean();

    if (!job) {
      throw new Error("Job not found");
    }

    if (
      job.client.toString() !==
      clientId.toString()
    ) {
      throw new Error(
        "You are not authorized to view these applications"
      );
    }

    const safePage =
      Math.max(Number(page) || 1, 1);

    const safeLimit = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    const skip =
      (safePage - 1) * safeLimit;

    const filter = {
      job: jobId,
    };

    if (status) {
      filter.status = status;
    }

    const [applications, total] =
      await Promise.all([
        Application.find(filter)
          .populate(
            "developer",
            "username email profileImage skills"
          )
          .populate("contract")
          .populate("transaction")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(safeLimit)
          .lean(),

        Application.countDocuments(filter),
      ]);

    return {
      applications,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(
          total / safeLimit
        ),
      },
    };
  }

  // ============================================================
  // REVIEW APPLICATION
  // ============================================================

  async reviewApplication({
    applicationId,
    clientId,
  }) {
    const session =
      await mongoose.startSession();

    try {
      let application;

      await session.withTransaction(
        async () => {
          application =
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

          this.assertJobClient(
            job,
            clientId
          );

          if (
            ![
              "pending",
              "reviewed",
            ].includes(
              application.status
            )
          ) {
            throw new Error(
              `Cannot review application with status "${application.status}"`
            );
          }

          application.status =
            "reviewed";

          application.reviewedAt =
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
  // SHORTLIST APPLICATION
  // ============================================================

  async shortlistApplication({
    applicationId,
    clientId,
  }) {
    const session =
      await mongoose.startSession();

    try {
      let application;
      let job;

      await session.withTransaction(
        async () => {
          application =
            await Application.findById(
              applicationId
            ).session(session);

          if (!application) {
            throw new Error(
              "Application not found"
            );
          }

          job =
            await Job.findById(
              application.job
            ).session(session);

          if (!job) {
            throw new Error(
              "Job not found"
            );
          }

          this.assertJobClient(
            job,
            clientId
          );

          if (
            ![
              "pending",
              "reviewed",
              "shortlisted",
            ].includes(
              application.status
            )
          ) {
            throw new Error(
              `Cannot shortlist application with status "${application.status}"`
            );
          }

          application.status =
            "shortlisted";

          application.reviewedAt =
            application.reviewedAt ||
            new Date();

          await application.save({
            session,
          });
        }
      );

      await this.createNotification(
        application.developer,
        `Your application for "${job.title}" has been shortlisted.`
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

          const job =
            await Job.findById(
              application.job
            ).session(session);

          if (!job) {
            throw new Error(
              "Job not found"
            );
          }

          this.assertJobClient(
            job,
            clientId
          );

          /*
           * Prevent two clients/actions from hiring
           * different developers for the same job.
           */
          if (job.hiredDeveloper) {
            if (
              job.hiredDeveloper.toString() ===
              application.developer.toString()
            ) {
              if (
                application.status ===
                "accepted"
              ) {
                result = {
                  application,
                  job,
                  alreadyAccepted: true,
                };

                return;
              }

              throw new Error(
                "This developer is already assigned to the job"
              );
            }

            throw new Error(
              "Another developer has already been hired for this job"
            );
          }

          if (
            ![
              "pending",
              "reviewed",
              "shortlisted",
            ].includes(
              application.status
            )
          ) {
            throw new Error(
              `Cannot accept application with status "${application.status}"`
            );
          }

          /*
           * Accept the selected application.
           */
          application.status =
            "accepted";

          application.acceptedAt =
            new Date();

          await application.save({
            session,
          });

          /*
           * Assign developer to the job.
           */
          job.hiredDeveloper =
            application.developer;

          job.status =
            "Filled";

          await job.save({
            session,
          });

          /*
           * Reject all other active applications.
           *
           * We do this inside the same transaction so the
           * application state and job assignment remain
           * consistent.
           */
          await Application.updateMany(
            {
              job: job._id,

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
            },
            {
              session,
            }
          );

          result = {
            application,
            job,
            alreadyAccepted: false,
          };
        }
      );

      /*
       * Notify developer after successful transaction.
       */
      if (result?.application) {
        const developer =
          await this.getUserInfo(
            result.application.developer
          );

        if (developer?.email) {
          await sendAcceptanceEmail({
            email: developer.email,
            developerName:
              developer.username ||
              "Developer",
            jobTitle:
              result.job.title,
          });
        }

        await this.createNotification(
          result.application.developer,
          `Congratulations! Your application for "${result.job.title}" has been accepted.`
        );
      }

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

          this.assertJobClient(
            job,
            clientId
          );

          if (
            application.status ===
            "rejected"
          ) {
            result = {
              application,
              job,
              alreadyRejected: true,
            };

            return;
          }

          if (
            application.status ===
            "accepted"
          ) {
            throw new Error(
              "An accepted application cannot be rejected"
            );
          }

          if (
            application.status ===
            "withdrawn"
          ) {
            throw new Error(
              "A withdrawn application cannot be rejected"
            );
          }

          application.status =
            "rejected";

          application.reviewedAt =
            new Date();

          await application.save({
            session,
          });

          result = {
            application,
            job,
            alreadyRejected: false,
          };
        }
      );

      if (
        result?.application &&
        !result.alreadyRejected
      ) {
        const developer =
          await this.getUserInfo(
            result.application.developer
          );

        if (developer?.email) {
          await sendRejectionEmail({
            email: developer.email,
            developerName:
              developer.username ||
              "Developer",
            jobTitle:
              result.job.title,
          });
        }

        await this.createNotification(
          result.application.developer,
          `Your application for "${result.job.title}" was not selected.`
        );
      }

      return result;
    } finally {
      await session.endSession();
    }
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
            await Application.findById(
              applicationId
            ).session(session);

          if (!application) {
            throw new Error(
              "Application not found"
            );
          }

          if (
            application.developer.toString() !==
            developerId.toString()
          ) {
            throw new Error(
              "You are not authorized to withdraw this application"
            );
          }

          if (
            application.status ===
            "withdrawn"
          ) {
            return;
          }

          if (
            application.status ===
            "accepted"
          ) {
            throw new Error(
              "An accepted application cannot be withdrawn"
            );
          }

          if (
            application.status ===
            "rejected"
          ) {
            throw new Error(
              "A rejected application cannot be withdrawn"
            );
          }

          application.status =
            "withdrawn";

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
  // UPDATE APPLICATION
  //
  // Developer can update their application only while it is
  // still under consideration.
  // ============================================================

  async updateApplication({
    applicationId,
    developerId,
    coverLetter,
    proposedBudget,
    proposedTimeline,
    attachments,
  }) {
    const application =
      await Application.findById(
        applicationId
      );

    if (!application) {
      throw new Error(
        "Application not found"
      );
    }

    if (
      application.developer.toString() !==
      developerId.toString()
    ) {
      throw new Error(
        "You are not authorized to update this application"
      );
    }

    if (
      ![
        "pending",
        "reviewed",
      ].includes(
        application.status
      )
    ) {
      throw new Error(
        "This application can no longer be edited"
      );
    }

    const job =
      await Job.findById(
        application.job
      );

    if (!job) {
      throw new Error("Job not found");
    }

    if (
      job.applicationDeadline &&
      new Date(job.applicationDeadline) <=
        new Date()
    ) {
      throw new Error(
        "The application deadline has passed"
      );
    }

    if (
      coverLetter !== undefined
    ) {
      if (!coverLetter.trim()) {
        throw new Error(
          "Cover letter cannot be empty"
        );
      }

      application.coverLetter =
        coverLetter.trim();
    }

    if (
      proposedBudget !== undefined
    ) {
      if (
        Number(proposedBudget) <= 0
      ) {
        throw new Error(
          "Proposed budget must be greater than zero"
        );
      }

      application.proposedBudget =
        Number(proposedBudget);
    }

    if (
      proposedTimeline !== undefined
    ) {
      application.proposedTimeline =
        proposedTimeline.trim();
    }

    if (
      attachments !== undefined
    ) {
      if (!Array.isArray(attachments)) {
        throw new Error(
          "Attachments must be an array"
        );
      }

      application.attachments =
        attachments;
    }

    await application.save();

    return application;
  }

  // ============================================================
  // DELETE APPLICATION
  //
  // Only withdrawn applications can be permanently removed.
  // This is optional but useful for cleanup.
  // ============================================================

  async deleteApplication({
    applicationId,
    developerId,
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

          if (
            application.developer.toString() !==
            developerId.toString()
          ) {
            throw new Error(
              "You are not authorized to delete this application"
            );
          }

          if (
            application.status !==
            "withdrawn"
          ) {
            throw new Error(
              "Only withdrawn applications can be deleted"
            );
          }

          await Application.deleteOne(
            {
              _id: application._id,
            },
            {
              session,
            }
          );

          const job =
            await Job.findById(
              application.job
            ).session(session);

          if (job) {
            job.applicationCount =
              Math.max(
                0,
                (job.applicationCount || 0) -
                  1
              );

            await job.save({
              session,
            });
          }

          result = {
            deleted: true,
            applicationId:
              application._id,
          };
        }
      );

      return result;
    } finally {
      await session.endSession();
    }
  }

  // ============================================================
  // APPLICATION STATISTICS
  // ============================================================

  async getApplicationStats(
    jobId,
    clientId
  ) {
    const job =
      await Job.findById(jobId)
        .select("client")
        .lean();

    if (!job) {
      throw new Error("Job not found");
    }

    this.assertJobClient(
      job,
      clientId
    );

    const stats =
      await Application.aggregate([
        {
          $match: {
            job: new mongoose.Types.ObjectId(
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
      reviewed: 0,
      shortlisted: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0,
    };

    for (const item of stats) {
      if (
        Object.prototype.hasOwnProperty.call(
          result,
          item._id
        )
      ) {
        result[item._id] =
          item.count;
      }

      result.total += item.count;
    }

    return result;
  }

  // ============================================================
  // NOTIFY NEW APPLICATION
  // ============================================================

  async notifyNewApplication(
    application,
    job
  ) {
    try {
      const client =
        await this.getUserInfo(
          job.client
        );

      const developer =
        await this.getUserInfo(
          application.developer
        );

      if (!client) {
        return;
      }

      const clientName =
        client.username || "Client";

      const developerName =
        developer?.username ||
        "Developer";

      /*
       * In-app notification.
       */
      await this.createNotification(
        job.client,
        `${developerName} submitted an application for "${job.title}".`
      );

      /*
       * Email notification.
       */
      if (client.email) {
        await sendApplicationEmail({
          email: client.email,
          clientName,
          developerName,
          jobTitle: job.title,
        });
      }
    } catch (error) {
      /*
       * Notification failure should not make a successful
       * application appear to have failed.
       */
      console.error(
        "Application notification error:",
        error
      );
    }
  }

  // ============================================================
  // CREATE NOTIFICATION
  // ============================================================

  async createNotification(
    userId,
    message
  ) {
    try {
      return await Notification.create({
        user: userId,
        message,
        isRead: false,
      });
    } catch (error) {
      console.error(
        "Notification creation error:",
        error
      );

      return null;
    }
  }
async getUserInfo(userId) {
  
    try {
      const { default: User } =
        await import(
          "../models/User.js"
        );

      return User.findById(userId)
        .select(
          "username email profileImage"
        )
        .lean();
    } catch (error) {
      console.error(
        "Failed to load user:",
        error
      );

      return null;
    }
  }

  // ============================================================
  // AUTHORIZATION HELPER
  // ============================================================

  assertJobClient(
    job,
    clientId
  ) {
    if (
      !job.client ||
      job.client.toString() !==
        clientId.toString()
    ) {
      throw new Error(
        "You are not authorized to manage applications for this job"
      );
    }
  }
}

export default new ApplicationService();