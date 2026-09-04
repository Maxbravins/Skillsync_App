import mongoose from "mongoose";
import Notification from "../models/notification.model.js";

class NotificationService {
  // ============================================================
  // CREATE NOTIFICATION
  // ============================================================

  async createNotification({
    recipient,
    type,
    title,
    message,
    data = {},
    priority = "normal",
    expiresAt = null,
  }) {
    if (!recipient) {
      throw new Error("Notification recipient is required");
    }

    if (!type) {
      throw new Error("Notification type is required");
    }

    if (!title) {
      throw new Error("Notification title is required");
    }

    if (!message) {
      throw new Error("Notification message is required");
    }

    const notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      data,
      priority,
      expiresAt,
      isRead: false,
    });

    return notification;
  }

  // ============================================================
  // CREATE MANY NOTIFICATIONS
  // ============================================================

  async createManyNotifications(notifications = []) {
    if (!Array.isArray(notifications)) {
      throw new Error("Notifications must be an array");
    }

    if (!notifications.length) {
      return [];
    }

    const preparedNotifications = notifications.map(
      (notification) => ({
        ...notification,
        isRead: false,
      })
    );

    return Notification.insertMany(preparedNotifications);
  }

  // ============================================================
  // NOTIFY USER
  //
  // Convenience wrapper around createNotification()
  // ============================================================

  async notifyUser({
    userId,
    type,
    title,
    message,
    data = {},
    priority = "normal",
    expiresAt = null,
  }) {
    return this.createNotification({
      recipient: userId,
      type,
      title,
      message,
      data,
      priority,
      expiresAt,
    });
  }

  // ============================================================
  // GET USER NOTIFICATIONS
  // ============================================================

  async getUserNotifications({
    userId,
    page = 1,
    limit = 20,
    unreadOnly = false,
  }) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    page = Math.max(1, Number(page) || 1);
    limit = Math.min(
      100,
      Math.max(1, Number(limit) || 20)
    );

    const skip = (page - 1) * limit;

    const query = {
      recipient: userId,
    };

    if (unreadOnly) {
      query.isRead = false;
    }

    const [notifications, total] =
      await Promise.all([
        Notification.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),

        Notification.countDocuments(query),
      ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  // ============================================================
  // GET SINGLE NOTIFICATION
  // ============================================================

  async getNotification({
    notificationId,
    userId,
  }) {
    if (!notificationId) {
      throw new Error("Notification ID is required");
    }

    if (!userId) {
      throw new Error("User ID is required");
    }

    const notification =
      await Notification.findOne({
        _id: notificationId,
        recipient: userId,
      }).lean();

    if (!notification) {
      throw new Error("Notification not found");
    }

    return notification;
  }

  // ============================================================
  // MARK AS READ
  // ============================================================

  async markAsRead({
    notificationId,
    userId,
  }) {
    if (!notificationId) {
      throw new Error("Notification ID is required");
    }

    if (!userId) {
      throw new Error("User ID is required");
    }

    const notification =
      await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          recipient: userId,
          isRead: false,
        },
        {
          $set: {
            isRead: true,
            readAt: new Date(),
          },
        },
        {
          new: true,
        }
      );

    if (!notification) {
      throw new Error(
        "Notification not found or already read"
      );
    }

    return notification;
  }

  // ============================================================
  // MARK ALL AS READ
  // ============================================================

  async markAllAsRead(userId) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const result =
      await Notification.updateMany(
        {
          recipient: userId,
          isRead: false,
        },
        {
          $set: {
            isRead: true,
            readAt: new Date(),
          },
        }
      );

    return {
      modifiedCount: result.modifiedCount,
    };
  }

  // ============================================================
  // GET UNREAD COUNT
  // ============================================================

  async getUnreadCount(userId) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    return Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });
  }

  // ============================================================
  // DELETE NOTIFICATION
  // ============================================================

  async deleteNotification({
    notificationId,
    userId,
  }) {
    if (!notificationId) {
      throw new Error("Notification ID is required");
    }

    if (!userId) {
      throw new Error("User ID is required");
    }

    const notification =
      await Notification.findOneAndDelete({
        _id: notificationId,
        recipient: userId,
      });

    if (!notification) {
      throw new Error("Notification not found");
    }

    return notification;
  }

  // ============================================================
  // DELETE ALL READ NOTIFICATIONS
  // ============================================================

  async deleteReadNotifications(userId) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const result =
      await Notification.deleteMany({
        recipient: userId,
        isRead: true,
      });

    return {
      deletedCount: result.deletedCount,
    };
  }

  // DELETE EXPIRED NOTIFICATIONS
  async deleteExpiredNotifications() {
    const result =
      await Notification.deleteMany({
        expiresAt: {
          $ne: null,
          $lte: new Date(),
        },
      });

    return {
      deletedCount: result.deletedCount,
    };
  }

  // ============================================================
  // PAYMENT NOTIFICATIONS
  // ============================================================

  async notifyPaymentSuccess({
    userId,
    transactionId,
    amount,
    currency,
    jobId = null,
  }) {
    return this.notifyUser({
      userId,
      type: "payment_success",
      title: "Payment Successful",
      message: `Your payment of ${currency} ${amount} was completed successfully.`,
      data: {
        transactionId,
        jobId,
        amount,
        currency,
      },
      priority: "high",
    });
  }

  async notifyPaymentFailed({
    userId,
    transactionId,
    amount,
    currency,
    reason = "Payment failed",
    jobId = null,
  }) {
    return this.notifyUser({
      userId,
      type: "payment_failed",
      title: "Payment Failed",
      message: `Your payment of ${currency} ${amount} could not be completed.`,
      data: {
        transactionId,
        jobId,
        amount,
        currency,
        reason,
      },
      priority: "high",
    });
  }

  // ============================================================
  // ESCROW NOTIFICATIONS
  // ============================================================

  async notifyEscrowFunded({
    clientId,
    developerId = null,
    jobId,
    amount,
    currency,
    transactionId,
  }) {
    const notifications = [];

    notifications.push(
      this.notifyUser({
        userId: clientId,
        type: "escrow_funded",
        title: "Escrow Funded",
        message: `Your payment of ${currency} ${amount} is now held in escrow.`,
        data: {
          jobId,
          transactionId,
          amount,
          currency,
        },
        priority: "high",
      })
    );

    if (developerId) {
      notifications.push(
        this.notifyUser({
          userId: developerId,
          type: "escrow_funded",
          title: "Project Funded",
          message: `The project has been funded with ${currency} ${amount}.`,
          data: {
            jobId,
            transactionId,
            amount,
            currency,
          },
          priority: "high",
        })
      );
    }

    return Promise.all(notifications);
  }

  async notifyMilestoneReleased({
    developerId,
    clientId = null,
    jobId,
    milestoneId,
    amount,
    currency,
    transactionId,
  }) {
    const notifications = [];

    notifications.push(
      this.notifyUser({
        userId: developerId,
        type: "milestone_released",
        title: "Milestone Payment Released",
        message: `You received ${currency} ${amount} for a completed milestone.`,
        data: {
          jobId,
          milestoneId,
          transactionId,
          amount,
          currency,
        },
        priority: "high",
      })
    );

    if (clientId) {
      notifications.push(
        this.notifyUser({
          userId: clientId,
          type: "milestone_released",
          title: "Milestone Payment Released",
          message: `${currency} ${amount} has been released to the developer.`,
          data: {
            jobId,
            milestoneId,
            transactionId,
            amount,
            currency,
          },
          priority: "normal",
        })
      );
    }

    return Promise.all(notifications);
  }

  async notifyRefund({
    clientId,
    jobId,
    transactionId,
    amount,
    currency,
    reason = "Payment refunded",
  }) {
    return this.notifyUser({
      userId: clientId,
      type: "refund",
      title: "Payment Refunded",
      message: `Your payment of ${currency} ${amount} has been refunded.`,
      data: {
        jobId,
        transactionId,
        amount,
        currency,
        reason,
      },
      priority: "high",
    });
  }

  // ============================================================
  // JOB NOTIFICATIONS
  // ============================================================

  async notifyJobApplication({
    clientId,
    jobId,
    applicationId,
    developerName = "A developer",
  }) {
    return this.notifyUser({
      userId: clientId,
      type: "job_application",
      title: "New Job Application",
      message: `${developerName} applied to your job.`,
      data: {
        jobId,
        applicationId,
      },
      priority: "normal",
    });
  }

  async notifyApplicationAccepted({
    developerId,
    jobId,
    applicationId,
    jobTitle = "your project",
  }) {
    return this.notifyUser({
      userId: developerId,
      type: "application_accepted",
      title: "Application Accepted",
      message: `Your application for ${jobTitle} has been accepted.`,
      data: {
        jobId,
        applicationId,
      },
      priority: "high",
    });
  }

  async notifyApplicationRejected({
    developerId,
    jobId,
    applicationId,
    jobTitle = "the project",
  }) {
    return this.notifyUser({
      userId: developerId,
      type: "application_rejected",
      title: "Application Update",
      message: `Your application for ${jobTitle} was not selected.`,
      data: {
        jobId,
        applicationId,
      },
      priority: "normal",
    });
  }

  // ============================================================
  // MILESTONE NOTIFICATIONS
  // ============================================================

  async notifyMilestoneCompleted({
    clientId,
    jobId,
    milestoneId,
    milestoneTitle,
  }) {
    return this.notifyUser({
      userId: clientId,
      type: "milestone_completed",
      title: "Milestone Completed",
      message: `The developer marked "${milestoneTitle}" as completed.`,
      data: {
        jobId,
        milestoneId,
        milestoneTitle,
      },
      priority: "normal",
    });
  }

  async notifyMilestoneApproved({
    developerId,
    jobId,
    milestoneId,
    milestoneTitle,
  }) {
    return this.notifyUser({
      userId: developerId,
      type: "milestone_approved",
      title: "Milestone Approved",
      message: `Your milestone "${milestoneTitle}" has been approved.`,
      data: {
        jobId,
        milestoneId,
        milestoneTitle,
      },
      priority: "high",
    });
  }

  // ============================================================
  // WITHDRAWAL NOTIFICATIONS
  // ============================================================

  async notifyWithdrawalSuccess({
    developerId,
    transactionId,
    amount,
    currency,
  }) {
    return this.notifyUser({
      userId: developerId,
      type: "withdrawal_success",
      title: "Withdrawal Successful",
      message: `Your withdrawal of ${currency} ${amount} was completed successfully.`,
      data: {
        transactionId,
        amount,
        currency,
      },
      priority: "high",
    });
  }

  async notifyWithdrawalFailed({
    developerId,
    transactionId,
    amount,
    currency,
    reason = "Withdrawal failed",
  }) {
    return this.notifyUser({
      userId: developerId,
      type: "withdrawal_failed",
      title: "Withdrawal Failed",
      message: `Your withdrawal of ${currency} ${amount} failed.`,
      data: {
        transactionId,
        amount,
        currency,
        reason,
      },
      priority: "high",
    });
  }

  // ============================================================
  // PREMIUM NOTIFICATIONS
  // ============================================================

  async notifyPremiumActivated({
    userId,
    plan,
    expiresAt,
  }) {
    return this.notifyUser({
      userId,
      type: "premium_activated",
      title: "Premium Activated",
      message: `Your ${plan} premium subscription is now active.`,
      data: {
        plan,
        expiresAt,
      },
      priority: "high",
    });
  }

  async notifyPremiumExpiring({
    userId,
    expiresAt,
    daysRemaining,
  }) {
    return this.notifyUser({
      userId,
      type: "premium_expiring",
      title: "Premium Expiring Soon",
      message: `Your premium subscription expires in ${daysRemaining} day(s).`,
      data: {
        expiresAt,
        daysRemaining,
      },
      priority: "normal",
    });
  }

  // ============================================================
  // SYSTEM NOTIFICATION
  // ============================================================

  async notifySystem({
    userId,
    title,
    message,
    data = {},
    priority = "normal",
  }) {
    return this.notifyUser({
      userId,
      type: "system",
      title,
      message,
      data,
      priority,
    });
  }
}

export default new NotificationService();
