import mongoose from "mongoose";

import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

import walletService from "./wallet.service.js";
import {
  initiateB2CPayment,
  formatPhoneNumber,
} from "./mpesa.service.js";

import {
  sendWithdrawalApprovedEmail,
  sendWithdrawalRejectedEmail,
} from "./email.service.js";

import notificationService from "./notification.service.js";

/*
|--------------------------------------------------------------------------
| WITHDRAWAL SERVICE
|--------------------------------------------------------------------------
|
| Withdrawal lifecycle:
|
| REQUESTED
|    ↓
| pending
|    ↓
| ADMIN APPROVES
|    ↓
| processing
|    ↓
| M-PESA B2C
|    ↓
| completed
|
| OR
|
| pending → cancelled
|
| OR
|
| processing → failed
|
|--------------------------------------------------------------------------
|
| Important:
|
| The wallet service remains responsible for wallet balances.
|
| This service is responsible for:
| - withdrawal requests
| - admin approval/rejection
| - M-Pesa B2C
| - transaction lifecycle
|
|--------------------------------------------------------------------------
*/

class WithdrawalService {
  // ============================================================
  // CONFIGURATION
  // ============================================================

  MIN_WITHDRAWAL_AMOUNT = 100;

  MAX_WITHDRAWAL_AMOUNT = 150000;

  SUPPORTED_CURRENCY = "KES";

  // ============================================================
  // HELPERS
  // ============================================================

  normalizeAmount(amount) {
    const value = Number(amount);

    if (!Number.isFinite(value)) {
      throw new Error("Invalid withdrawal amount");
    }

    return Math.round(value * 100) / 100;
  }

  validateAmount(amount) {
    const value = this.normalizeAmount(amount);

    if (value <= 0) {
      throw new Error(
        "Withdrawal amount must be greater than zero"
      );
    }

    if (value < this.MIN_WITHDRAWAL_AMOUNT) {
      throw new Error(
        `Minimum withdrawal amount is KES ${this.MIN_WITHDRAWAL_AMOUNT}`
      );
    }

    if (value > this.MAX_WITHDRAWAL_AMOUNT) {
      throw new Error(
        `Maximum withdrawal amount is KES ${this.MAX_WITHDRAWAL_AMOUNT}`
      );
    }

    return value;
  }

  async getDeveloper(developerId, session = null) {
    const query = User.findById(developerId);

    if (session) {
      query.session(session);
    }

    const developer = await query;

    if (!developer) {
      throw new Error("Developer not found");
    }

    return developer;
  }

  async getWalletBalance(developerId) {
    /*
     * Keep wallet logic inside walletService.
     *
     * This allows the wallet implementation to change
     * without changing withdrawal logic.
     */

    if (
      typeof walletService.getBalance !==
      "function"
    ) {
      throw new Error(
        "walletService.getBalance() is not implemented"
      );
    }

    const result =
      await walletService.getBalance(
        developerId
      );

    /*
     * Support either:
     *
     * getBalance() → number
     *
     * or
     *
     * getBalance() → { balance: number }
     */

    if (
      typeof result === "number"
    ) {
      return result;
    }

    return Number(
      result?.balance || 0
    );
  }

  // ============================================================
  // GET ACTIVE WITHDRAWAL
  // ============================================================

  async getActiveWithdrawal(
    developerId
  ) {
    return Transaction.findOne({
      developer: developerId,

      type: "withdrawal",

      status: {
        $in: [
          "pending",
          "processing",
          "review_required",
        ],
      },
    }).sort({
      createdAt: -1,
    });
  }

  // ============================================================
  // REQUEST WITHDRAWAL
  // ============================================================

  async requestWithdrawal({
    developerId,
    amount,
    phoneNumber,
    currency = "KES",
  }) {
    const session =
      await mongoose.startSession();

    try {
      let result;

      await session.withTransaction(
        async () => {
          const developer =
            await this.getDeveloper(
              developerId,
              session
            );

          if (currency !== this.SUPPORTED_CURRENCY) {
            throw new Error(
              "Withdrawals currently support KES only"
            );
          }

          const withdrawalAmount =
            this.validateAmount(amount);

          if (!phoneNumber) {
            throw new Error(
              "Phone number is required"
            );
          }

          const formattedPhone =
            formatPhoneNumber(
              phoneNumber
            );

          /*
           * Prevent multiple active withdrawals.
           */

          const activeWithdrawal =
            await Transaction.findOne({
              developer: developer._id,

              type: "withdrawal",

              status: {
                $in: [
                  "pending",
                  "processing",
                  "review_required",
                ],
              },
            })
              .session(session);

          if (activeWithdrawal) {
            throw new Error(
              "You already have an active withdrawal request"
            );
          }

          /*
           * Check wallet balance.
           */

          const walletBalance =
            await this.getWalletBalance(
              developer._id
            );

          if (
            walletBalance <
            withdrawalAmount
          ) {
            throw new Error(
              `Insufficient wallet balance. Available balance: KES ${walletBalance}`
            );
          }

          /*
           * Create withdrawal transaction.
           *
           * IMPORTANT:
           *
           * We do not immediately send M-Pesa here.
           *
           * The request first requires admin approval.
           */

          const transaction =
            new Transaction({
              type: "withdrawal",

              developer:
                developer._id,

              amount:
                withdrawalAmount,

              platformFee: 0,

              developerAmount:
                withdrawalAmount,

              totalAmount:
                withdrawalAmount,

              currency,

              status: "pending",

              paymentMethod:
                "mpesa",

              mpesa: {
                phoneNumber:
                  formattedPhone,
              },

              description:
                "Developer withdrawal request",

              metadata: {
                source:
                  "developer_withdrawal",

                requestedBy:
                  developer._id.toString(),

                requestedAt:
                  new Date(),
              },

              review: {
                required: true,

                reason:
                  "Withdrawal awaiting admin approval",

                createdAt:
                  new Date(),
              },
            });

          await transaction.save({
            session,
          });

          result = transaction;
        }
      );

      /*
       * Notify admin/user outside the transaction
       * if desired.
       */

      return result;
    } finally {
      await session.endSession();
    }
  }

  // ============================================================
  // GET WITHDRAWAL
  // ============================================================

  async getWithdrawal(
    transactionId,
    developerId = null
  ) {
    const query = {
      _id: transactionId,
      type: "withdrawal",
    };

    if (developerId) {
      query.developer =
        developerId;
    }

    const transaction =
      await Transaction.findOne(query)
        .populate(
          "developer",
          "username email"
        )
        .lean();

    if (!transaction) {
      throw new Error(
        "Withdrawal transaction not found"
      );
    }

    return transaction;
  }

  // ============================================================
  // GET DEVELOPER WITHDRAWALS
  // ============================================================

  async getDeveloperWithdrawals({
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
      type: "withdrawal",
    };

    if (status) {
      query.status = status;
    }

    const [
      transactions,
      total,
    ] = await Promise.all([
      Transaction.find(query)
        .sort({
          createdAt: -1,
        })
        .skip(
          (currentPage - 1) *
            pageLimit
        )
        .limit(pageLimit)
        .lean(),

      Transaction.countDocuments(
        query
      ),
    ]);

    return {
      transactions,

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
  // ADMIN: GET PENDING WITHDRAWALS
  // ============================================================

  async getPendingWithdrawals({
    page = 1,
    limit = 20,
  } = {}) {
    const currentPage =
      Math.max(Number(page), 1);

    const pageLimit = Math.min(
      Math.max(Number(limit), 1),
      100
    );

    const query = {
      type: "withdrawal",

      status: {
        $in: [
          "pending",
          "review_required",
        ],
      },
    };

    const [
      transactions,
      total,
    ] = await Promise.all([
      Transaction.find(query)
        .populate(
          "developer",
          "username email"
        )
        .sort({
          createdAt: 1,
        })
        .skip(
          (currentPage - 1) *
            pageLimit
        )
        .limit(pageLimit)
        .lean(),

      Transaction.countDocuments(
        query
      ),
    ]);

    return {
      transactions,

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
  // ADMIN: APPROVE WITHDRAWAL
  // ============================================================

  async approveWithdrawal({
    transactionId,
    adminId,
  }) {
    const session =
      await mongoose.startSession();

    try {
      let result;

      await session.withTransaction(
        async () => {
          const transaction =
            await Transaction.findOne({
              _id: transactionId,

              type: "withdrawal",
            }).session(session);

          if (!transaction) {
            throw new Error(
              "Withdrawal transaction not found"
            );
          }

          if (
            transaction.status ===
            "completed"
          ) {
            result = {
              transaction,
              alreadyApproved: true,
            };

            return;
          }

          if (
            transaction.status !==
            "pending" &&
            transaction.status !==
            "review_required"
          ) {
            throw new Error(
              `Cannot approve withdrawal with status "${transaction.status}"`
            );
          }

          /*
           * Verify developer still has sufficient
           * wallet balance.
           */

          const walletBalance =
            await this.getWalletBalance(
              transaction.developer
            );

          if (
            walletBalance <
            transaction.totalAmount
          ) {
            throw new Error(
              `Insufficient wallet balance. Available balance: KES ${walletBalance}`
            );
          }

          /*
           * Record admin approval.
           */

          transaction.status =
            "processing";

          transaction.review = {
            required: false,

            reason:
              "Withdrawal approved by administrator",

            createdAt:
              transaction.review
                ?.createdAt ||
              new Date(),

            resolvedAt:
              new Date(),

            resolvedBy: adminId,
          };

          transaction.metadata = {
            ...(transaction.metadata || {}),

            approvedBy:
              adminId?.toString(),

            approvedAt:
              new Date(),

            source:
              "admin_withdrawal_approval",
          };

          await transaction.save({
            session,
          });

          result = {
            transaction,

            alreadyApproved: false,
          };
        }
      );

      /*
       * Start M-Pesa only AFTER database approval
       * transaction commits.
       *
       * This prevents an external M-Pesa call from
       * happening inside a MongoDB transaction.
       */

      if (
        result?.transaction?.status ===
        "processing" &&
        !result.alreadyApproved
      ) {
        result =
          await this.sendToMpesa(
            result.transaction._id
          );
      }

      /*
       * Email/notification.
       */

      if (
        result?.transaction
          ?.developer
      ) {
        await this.notifyWithdrawalApproved(
          result.transaction
        );
      }

      return result;
    } finally {
      await session.endSession();
    }
  }

  // ============================================================
  // SEND APPROVED WITHDRAWAL TO M-PESA
  // ============================================================

  async sendToMpesa(
    transactionId
  ) {
    const transaction =
      await Transaction.findOne({
        _id: transactionId,

        type: "withdrawal",
      });

    if (!transaction) {
      throw new Error(
        "Withdrawal transaction not found"
      );
    }

    if (
      transaction.status ===
      "completed"
    ) {
      return {
        transaction,
        alreadyCompleted: true,
      };
    }

    if (
      transaction.status !==
      "processing"
    ) {
      throw new Error(
        `Withdrawal must be processing before sending to M-Pesa. Current status: ${transaction.status}`
      );
    }

    const phoneNumber =
      transaction.mpesa
        ?.phoneNumber;

    if (!phoneNumber) {
      transaction.status =
        "failed";

      transaction.mpesa.resultDesc =
        "Withdrawal phone number is missing";

      await transaction.save();

      throw new Error(
        "Withdrawal phone number is missing"
      );
    }

    try {
      const response =
        await initiateB2CPayment({
          phoneNumber,

          amount:
            transaction.totalAmount,

          remarks:
            "SkillSync Withdrawal",

          occasion:
            transaction.transactionId,
        });

      transaction.paymentProviderData = {
        ...(transaction.paymentProviderData ||
          {}),

        provider: "mpesa",

        response,
      };

      transaction.metadata = {
        ...(transaction.metadata ||
          {}),

        mpesaInitiatedAt:
          new Date(),
      };

      await transaction.save();

      return {
        transaction,

        providerResponse:
          response,

        alreadyCompleted: false,
      };
    } catch (error) {
      transaction.status =
        "failed";

      transaction.mpesa.resultDesc =
        error.message ||
        "M-Pesa withdrawal failed";

      transaction.paymentProviderData = {
        ...(transaction.paymentProviderData ||
          {}),

        provider: "mpesa",

        error: {
          message:
            error.message,

          occurredAt:
            new Date(),
        },
      };

      await transaction.save();

      /*
       * The wallet should NOT be permanently lost.
       *
       * Because the wallet was not deducted by this
       * service yet, no wallet restoration is required.
       */

      throw error;
    }
  }

  // ============================================================
  // ADMIN: REJECT WITHDRAWAL
  // ============================================================

  async rejectWithdrawal({
    transactionId,
    adminId,
    reason = "Withdrawal rejected",
  }) {
    const session =
      await mongoose.startSession();

    try {
      let transaction;

      await session.withTransaction(
        async () => {
          transaction =
            await Transaction.findOne({
              _id: transactionId,

              type: "withdrawal",
            }).session(session);

          if (!transaction) {
            throw new Error(
              "Withdrawal transaction not found"
            );
          }

          if (
            transaction.status ===
            "cancelled"
          ) {
            return;
          }

          if (
            transaction.status !==
              "pending" &&
            transaction.status !==
              "review_required"
          ) {
            throw new Error(
              `Cannot reject withdrawal with status "${transaction.status}"`
            );
          }

          transaction.status =
            "cancelled";

          transaction.review = {
            required: false,

            reason,

            createdAt:
              transaction.review
                ?.createdAt ||
              new Date(),

            resolvedAt:
              new Date(),

            resolvedBy: adminId,
          };

          transaction.metadata = {
            ...(transaction.metadata ||
              {}),

            rejectedBy:
              adminId?.toString(),

            rejectedAt:
              new Date(),

            rejectionReason:
              reason,
          };

          await transaction.save({
            session,
          });
        }
      );

      if (transaction) {
        await this.notifyWithdrawalRejected(
          transaction,
          reason
        );
      }

      return transaction;
    } finally {
      await session.endSession();
    }
  }

  // ============================================================
  // M-PESA B2C RESULT CALLBACK
  // ============================================================

  async processMpesaCallback({
    transactionId,
    resultCode,
    resultDesc,
    callbackMetadata = {},
  }) {
    const session =
      await mongoose.startSession();

    try {
      let result;

      await session.withTransaction(
        async () => {
          /*
           * Prefer transactionId supplied by your
           * B2C implementation.
           *
           * If your B2C callback uses ConversationID
           * or OriginatorConversationID instead,
           * adapt the lookup here.
           */

          const transaction =
            await Transaction.findOne({
              $or: [
                {
                  _id: mongoose.isValidObjectId(
                    transactionId
                  )
                    ? transactionId
                    : null,
                },

                {
                  transactionId,
                },

                {
                  "paymentProviderData.response.ConversationID":
                    transactionId,
                },

                {
                  "paymentProviderData.response.OriginatorConversationID":
                    transactionId,
                },
              ],

              type: "withdrawal",
            }).session(session);

          if (!transaction) {
            throw new Error(
              "Withdrawal transaction not found"
            );
          }

          /*
           * Idempotency.
           */

          if (
            transaction.status ===
            "completed"
          ) {
            result = {
              transaction,

              success: true,

              alreadyProcessed: true,
            };

            return;
          }

          /*
           * Ignore duplicate terminal callbacks.
           */

          if (
            ["failed", "cancelled"].includes(
              transaction.status
            )
          ) {
            result = {
              transaction,

              success: false,

              alreadyProcessed: true,
            };

            return;
          }

          transaction.mpesa =
            transaction.mpesa || {};

          transaction.mpesa.resultCode =
            resultCode ?? null;

          transaction.mpesa.resultDesc =
            resultDesc || "";

          transaction.paymentProviderData = {
            ...(transaction.paymentProviderData ||
              {}),

            callback: callbackMetadata,

            callbackReceivedAt:
              new Date(),
          };

          /*
           * M-Pesa B2C success.
           */

          if (
            Number(resultCode) === 0
          ) {
            const receiptNumber =
              callbackMetadata
                ?.TransactionID ||
              callbackMetadata
                ?.MpesaReceiptNumber ||
              callbackMetadata
                ?.ReceiptNumber ||
              "";

            if (receiptNumber) {
              transaction.mpesa.mpesaReceiptNumber =
                receiptNumber;
            }

            transaction.status =
              "completed";

            transaction.completedAt =
              new Date();

            transaction.withdrawnAt =
              new Date();

            transaction.paidAt =
              new Date();

            transaction.metadata = {
              ...(transaction.metadata ||
                {}),

              mpesaCompletedAt:
                new Date(),

              providerTransactionId:
                receiptNumber,
            };

            await transaction.save({
              session,
            });

            result = {
              transaction,

              success: true,

              alreadyProcessed: false,
            };

            return;
          }

          /*
           * M-Pesa withdrawal failed.
           */

          transaction.status =
            "failed";

          await transaction.save({
            session,
          });

          result = {
            transaction,

            success: false,

            alreadyProcessed: false,
          };
        }
      );

      /*
       * Notify developer after successful DB commit.
       */

      if (
        result?.transaction
          ?.developer
      ) {
        if (result.success) {
          await this.notifyWithdrawalCompleted(
            result.transaction
          );
        } else {
          await this.notifyWithdrawalFailed(
            result.transaction
          );
        }
      }

      return result;
    } finally {
      await session.endSession();
    }
  }

  // ============================================================
  // CANCEL OWN PENDING WITHDRAWAL
  // ============================================================

  async cancelWithdrawal({
    transactionId,
    developerId,
  }) {
    const session =
      await mongoose.startSession();

    try {
      let transaction;

      await session.withTransaction(
        async () => {
          transaction =
            await Transaction.findOne({
              _id: transactionId,

              developer: developerId,

              type: "withdrawal",
            }).session(session);

          if (!transaction) {
            throw new Error(
              "Withdrawal transaction not found"
            );
          }

          if (
            transaction.status ===
            "cancelled"
          ) {
            return;
          }

          if (
            transaction.status !==
            "pending"
          ) {
            throw new Error(
              "Only pending withdrawals can be cancelled"
            );
          }

          transaction.status =
            "cancelled";

          transaction.metadata = {
            ...(transaction.metadata ||
              {}),

            cancelledBy:
              developerId.toString(),

            cancelledAt:
              new Date(),
          };

          await transaction.save({
            session,
          });
        }
      );

      return transaction;
    } finally {
      await session.endSession();
    }
  }

  // ============================================================
  // NOTIFICATIONS
  // ============================================================

  async notifyWithdrawalApproved(
    transaction
  ) {
    try {
      const developer =
        await User.findById(
          transaction.developer
        ).select(
          "username email"
        );

      if (!developer) {
        return;
      }

      /*
       * Email.
       */

      if (developer.email) {
        await sendWithdrawalApprovedEmail(
          {
            email:
              developer.email,

            developerName:
              developer.username ||
              "Developer",

            amount:
              transaction.totalAmount,
          }
        );
      }

      if (
        notificationService &&
        typeof notificationService.createNotification ===
          "function"
      ) {
        await notificationService.createNotification(
          {
            userId:
              developer._id,

            message:
              `Your withdrawal request of KES ${transaction.totalAmount} has been approved and sent for M-Pesa processing.`,
          }
        );
      }
    } catch (error) {
      /*
       * Notification failure should never
       * break a successful financial operation.
       */

      console.error(
        "Withdrawal approval notification error:",
        error
      );
    }
  }

  async notifyWithdrawalRejected(
    transaction,
    reason
  ) {
    try {
      const developer =
        await User.findById(
          transaction.developer
        ).select(
          "username email"
        );

      if (!developer) {
        return;
      }

      if (developer.email) {
        await sendWithdrawalRejectedEmail(
          {
            email:
              developer.email,

            developerName:
              developer.username ||
              "Developer",

            amount:
              transaction.totalAmount,
          }
        );
      }

      if (
        notificationService &&
        typeof notificationService.createNotification ===
          "function"
      ) {
        await notificationService.createNotification(
          {
            userId:
              developer._id,

            message:
              `Your withdrawal request of KES ${transaction.totalAmount} was rejected. Reason: ${reason}`,
          }
        );
      }
    } catch (error) {
      console.error(
        "Withdrawal rejection notification error:",
        error
      );
    }
  }

  async notifyWithdrawalCompleted(
    transaction
  ) {
    try {
      const developer =
        await User.findById(
          transaction.developer
        ).select(
          "username email"
        );

      if (!developer) {
        return;
      }

      if (
        notificationService &&
        typeof notificationService.createNotification ===
          "function"
      ) {
        await notificationService.createNotification(
          {
            userId:
              developer._id,

            message:
              `Your withdrawal of KES ${transaction.totalAmount} has been completed successfully.`,
          }
        );
      }
    } catch (error) {
      console.error(
        "Withdrawal completion notification error:",
        error
      );
    }
  }

  async notifyWithdrawalFailed(
    transaction
  ) {
    try {
      const developer =
        await User.findById(
          transaction.developer
        ).select(
          "username email"
        );

      if (!developer) {
        return;
      }

      if (
        notificationService &&
        typeof notificationService.createNotification ===
          "function"
      ) {
        await notificationService.createNotification(
          {
            userId:
              developer._id,

            message:
              `Your withdrawal of KES ${transaction.totalAmount} could not be completed. ${transaction.mpesa?.resultDesc || "Please contact support."}`,
          }
        );
      }
    } catch (error) {
      console.error(
        "Withdrawal failure notification error:",
        error
      );
    }
  }
}

export default new WithdrawalService();
