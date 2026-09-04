import mongoose from "mongoose";
import Job from "../models/job.model.js";
import Transaction from "../models/transaction.model.js";

class EscrowService {
  // ============================================================
  // FUND ESCROW
  // ============================================================

  async fundEscrow(
    { transactionId },
    externalSession = null
  ) {
    const execute = async (session) => {
      const transaction =
        await Transaction.findById(
          transactionId
        ).session(session);

      if (!transaction) {
        throw new Error(
          "Payment transaction not found"
        );
      }

      if (
        transaction.type !==
        "project_payment"
      ) {
        throw new Error(
          "Only project payments can fund escrow"
        );
      }

      if (
        transaction.status !==
        "completed"
      ) {
        throw new Error(
          "Only completed payments can fund escrow"
        );
      }

      const job =
        await Job.findById(
          transaction.job
        ).session(session);

      if (!job) {
        throw new Error(
          "Job associated with transaction not found"
        );
      }

      // Idempotency protection.
      if (
        transaction.escrowStatus ===
        "held"
      ) {
        return {
          transaction,
          job,
          alreadyFunded: true,
        };
      }

      if (
        transaction.escrowStatus
      ) {
        throw new Error(
          `Cannot fund escrow with escrow status "${transaction.escrowStatus}"`
        );
      }

      const escrowAmount =
        transaction.developerAmount;

      if (
        !escrowAmount ||
        escrowAmount <= 0
      ) {
        throw new Error(
          "Invalid escrow amount"
        );
      }

      transaction.escrowStatus =
        "held";

      await transaction.save({
        session,
      });

      job.escrowAmount =
        (job.escrowAmount || 0) +
        escrowAmount;

      job.paymentStatus =
        "escrow";

      await job.save({
        session,
      });

      return {
        transaction,
        job,
        alreadyFunded: false,
      };
    };

    // Reuse an existing transaction.
    if (externalSession) {
      return execute(externalSession);
    }

    const session =
      await mongoose.startSession();

    try {
      let result;

      await session.withTransaction(
        async () => {
          result = await execute(
            session
          );
        }
      );

      return result;
    } finally {
      await session.endSession();
    }
  }

  // ============================================================
  // RELEASE MILESTONE
  // ============================================================

  async releaseMilestone({
    jobId,
    milestoneId,
    developerId,
    paymentMethod = "wallet",
  }) {
    const session =
      await mongoose.startSession();

    try {
      let result;

      await session.withTransaction(
        async () => {
          const job =
            await Job.findById(
              jobId
            ).session(session);

          if (!job) {
            throw new Error(
              "Job not found"
            );
          }

          if (
            !job.hiredDeveloper ||
            job.hiredDeveloper.toString() !==
              developerId.toString()
          ) {
            throw new Error(
              "Developer is not assigned to this job"
            );
          }

          const milestone =
            job.milestones.id(
              milestoneId
            );

          if (!milestone) {
            throw new Error(
              "Milestone not found"
            );
          }

          /*
           * A milestone must be approved
           * before funds are released.
           */
          if (
            milestone.status !==
            "approved"
          ) {
            throw new Error(
              "Only approved milestones can be released"
            );
          }

          const amount =
            milestone.amount;

          if (
            !amount ||
            amount <= 0
          ) {
            throw new Error(
              "Invalid milestone amount"
            );
          }

          if (
            job.escrowAmount < amount
          ) {
            throw new Error(
              "Insufficient escrow balance"
            );
          }

          /*
           * Prevent duplicate release.
           */
          const existingRelease =
            await Transaction.findOne({
              job: job._id,

              milestone:
                milestone._id,

              type:
                "milestone_release",

              status: {
                $in: [
                  "pending",
                  "processing",
                  "completed",
                ],
              },
            }).session(session);

          if (existingRelease) {
            result = {
              transaction:
                existingRelease,

              job,

              milestone,

              alreadyReleased:
                existingRelease.status ===
                "completed",
            };

            return;
          }

          const now =
            new Date();

          /*
           * Create the immutable
           * release transaction.
           */
          const releaseTransaction =
            new Transaction({
              type:
                "milestone_release",

              client:
                job.client,

              developer:
                job.hiredDeveloper,

              job:
                job._id,

              milestone:
                milestone._id,

              amount,

              platformFee: 0,

              developerAmount:
                amount,

              totalAmount:
                amount,

              currency:
                job.currency,

              status:
                "completed",

              escrowStatus:
                "released",

              releasedAt:
                now,

              completedAt:
                now,

              paymentMethod,

              description:
                `Release for milestone: ${milestone.title}`,

              metadata: {
                source:
                  "milestone_release",
              },
            });

          await releaseTransaction.save({
            session,
          });

          /*
           * Update escrow aggregate.
           */
          job.escrowAmount -=
            amount;

          job.releasedAmount =
            (job.releasedAmount || 0) +
            amount;

          /*
           * Keep milestone state
           * within the allowed schema values.
           */
          milestone.status =
            "completed";

          milestone.approvedAt =
            milestone.approvedAt ||
            now;

          /*
           * Track release separately.
           * Requires releasedAt in the
           * milestone schema.
           */
          milestone.releasedAt =
            now;

          /*
           * Prevent floating-point
           * residue from creating
           * negative escrow.
           */
          if (
            job.escrowAmount < 0
          ) {
            job.escrowAmount = 0;
          }

          if (
            job.escrowAmount === 0
          ) {
            job.paymentStatus =
              "paid";
          } else {
            job.paymentStatus =
              "escrow";
          }

          await job.save({
            session,
          });

          result = {
            transaction:
              releaseTransaction,

            job,

            milestone,

            alreadyReleased:
              false,
          };
        }
      );

      return result;
    } finally {
      await session.endSession();
    }
  }

  // ============================================================
  // REFUND ESCROW
  // ============================================================

  async refundEscrow({
    transactionId,
    reason = "Escrow refunded",
  }) {
    const session =
      await mongoose.startSession();

    try {
      let result;

      await session.withTransaction(
        async () => {
          const originalTransaction =
            await Transaction.findById(
              transactionId
            ).session(session);

          if (!originalTransaction) {
            throw new Error(
              "Original transaction not found"
            );
          }

          if (
            originalTransaction.type !==
            "project_payment"
          ) {
            throw new Error(
              "Only project payments can be refunded through escrow"
            );
          }

          if (
            originalTransaction
              .escrowStatus !==
            "held"
          ) {
            throw new Error(
              "Only funds currently held in escrow can be refunded"
            );
          }

          const job =
            await Job.findById(
              originalTransaction.job
            ).session(session);

          if (!job) {
            throw new Error(
              "Job not found"
            );
          }

          /*
           * Find an existing refund
           * using metadata.originalTransactionId.
           *
           * metadata is Mixed, so we
           * query the nested field directly.
           */
          const existingRefund =
            await Transaction.findOne({
              type: "refund",

              job: job._id,

              "metadata.originalTransactionId":
                originalTransaction._id.toString(),

              status: {
                $in: [
                  "pending",
                  "processing",
                  "completed",
                ],
              },
            }).session(session);

          if (existingRefund) {
            result = {
              transaction:
                existingRefund,

              job,

              alreadyRefunded:
                true,
            };

            return;
          }

          const refundAmount =
            originalTransaction
              .developerAmount;

          if (
            !refundAmount ||
            refundAmount <= 0
          ) {
            throw new Error(
              "Invalid refund amount"
            );
          }

          if (
            job.escrowAmount <
            refundAmount
          ) {
            throw new Error(
              "Insufficient escrow balance for refund"
            );
          }

          const now =
            new Date();

          /*
           * Mark the original
           * payment transaction
           * as refunded.
           */
          originalTransaction
            .escrowStatus =
            "refunded";

          originalTransaction.status =
            "refunded";

          originalTransaction.refundedAt =
            now;

          await originalTransaction.save({
            session,
          });

          /*
           * Create a separate,
           * immutable refund record.
           */
          const refundTransaction =
            new Transaction({
              type:
                "refund",

              client:
                originalTransaction.client,

              developer:
                originalTransaction.developer,

              job:
                originalTransaction.job,

              application:
                originalTransaction.application,

              contract:
                originalTransaction.contract,

              amount:
                refundAmount,

              platformFee: 0,

              developerAmount: 0,

              totalAmount:
                refundAmount,

              currency:
                originalTransaction.currency,

              status:
                "completed",

              escrowStatus:
                "refunded",

              completedAt:
                now,

              refundedAt:
                now,

              paymentMethod:
                originalTransaction.paymentMethod,

              description:
                reason,

              metadata: {
                source:
                  "escrow_refund",

                originalTransactionId:
                  originalTransaction._id.toString(),
              },
            });

          await refundTransaction.save({
            session,
          });

          /*
           * Update job escrow.
           */
          job.escrowAmount -=
            refundAmount;

          job.refundedAmount =
            (job.refundedAmount || 0) +
            refundAmount;

          if (
            job.escrowAmount < 0
          ) {
            job.escrowAmount = 0;
          }

          /*
           * Determine the new
           * payment state.
           */
          if (
            job.escrowAmount === 0 &&
            job.releasedAmount === 0
          ) {
            job.paymentStatus =
              "refunded";
          } else if (
            job.escrowAmount === 0
          ) {
            job.paymentStatus =
              "paid";
          } else {
            job.paymentStatus =
              "escrow";
          }

          await job.save({
            session,
          });

          result = {
            transaction:
              refundTransaction,

            originalTransaction,

            job,

            alreadyRefunded:
              false,
          };
        }
      );

      return result;
    } finally {
      await session.endSession();
    }
  }

  // ============================================================
  // GET ESCROW BALANCE
  // ============================================================

  async getEscrowBalance(
    jobId
  ) {
    const job =
      await Job.findById(
        jobId
      )
        .select(
          [
            "budget",
            "escrowAmount",
            "releasedAmount",
            "refundedAmount",
            "currency",
            "paymentStatus",
          ].join(" ")
        )
        .lean();

    if (!job) {
      throw new Error(
        "Job not found"
      );
    }

    return {
      jobId: job._id,

      budget:
        job.budget,

      escrowAmount:
        job.escrowAmount || 0,

      releasedAmount:
        job.releasedAmount || 0,

      refundedAmount:
        job.refundedAmount || 0,

      currency:
        job.currency,

      paymentStatus:
        job.paymentStatus,
    };
  }

  // ============================================================
  // GET ESCROW TRANSACTIONS
  // ============================================================

  async getJobEscrowTransactions(
    jobId
  ) {
    return Transaction.find({
      job: jobId,

      type: {
        $in: [
          "project_payment",
          "milestone_release",
          "refund",
        ],
      },
    })
      .sort({
        createdAt: -1,
      })
      .lean();
  }
}

export default new EscrowService();
