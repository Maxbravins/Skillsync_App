import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

class WalletService {
  // ============================================================
  // GET DEVELOPER WALLET BALANCE
  //
  // Wallet balance is derived from the transaction ledger.
  //
  // Credits:
  //   completed milestone_release transactions
  //
  // Debits:
  //   completed withdrawals
  //
  // Pending/processing withdrawals are considered reserved
  // and therefore reduce the available balance.
  // ============================================================

  async getBalance(developerId) {
    if (!developerId) {
      throw new Error("Developer ID is required");
    }

    const developer = await User.findById(developerId)
      .select("_id")
      .lean();

    if (!developer) {
      throw new Error("Developer not found");
    }

    const credits = await Transaction.aggregate([
      {
        $match: {
          developer: new mongoose.Types.ObjectId(
            developerId
          ),

          type: "milestone_release",

          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$developerAmount",
          },
        },
      },
    ]);

    const withdrawals = await Transaction.aggregate([
      {
        $match: {
          developer: new mongoose.Types.ObjectId(
            developerId
          ),

          type: "withdrawal",

          status: {
            $in: [
              "pending",
              "processing",
              "completed",
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$developerAmount",
          },
        },
      },
    ]);

    const totalEarned =
      credits[0]?.total || 0;

    const totalWithdrawn =
      withdrawals[0]?.total || 0;

    const availableBalance =
      Math.max(
        0,
        totalEarned - totalWithdrawn
      );

    return {
      developerId: developer._id,

      currency: "KES",

      totalEarned:
        this.roundMoney(totalEarned),

      totalWithdrawn:
        this.roundMoney(totalWithdrawn),

      availableBalance:
        this.roundMoney(availableBalance),
    };
  }

  // ============================================================
  // GET AVAILABLE BALANCE
  // ============================================================

  async getAvailableBalance(developerId) {
    const wallet =
      await this.getBalance(developerId);

    return wallet.availableBalance;
  }

  // ============================================================
  // CHECK WHETHER DEVELOPER CAN WITHDRAW
  // ============================================================

  async canWithdraw(
    developerId,
    amount
  ) {
    if (!amount || amount <= 0) {
      throw new Error(
        "Withdrawal amount must be greater than zero"
      );
    }

    const balance =
      await this.getAvailableBalance(
        developerId
      );

    return {
      allowed: balance >= amount,

      requestedAmount:
        this.roundMoney(amount),

      availableBalance:
        this.roundMoney(balance),

      insufficient:
        balance < amount,
    };
  }

  // ============================================================
  // VALIDATE WITHDRAWAL
  //
  // This is intentionally separate from creating the
  // withdrawal transaction.
  // ============================================================

  async validateWithdrawal({
    developerId,
    amount,
    currency = "KES",
  }) {
    if (!developerId) {
      throw new Error(
        "Developer ID is required"
      );
    }

    if (!amount || amount <= 0) {
      throw new Error(
        "Withdrawal amount must be greater than zero"
      );
    }

    if (currency !== "KES") {
      throw new Error(
        "Wallet withdrawals currently support KES only"
      );
    }

    const wallet =
      await this.getBalance(developerId);

    if (
      wallet.availableBalance < amount
    ) {
      throw new Error(
        `Insufficient wallet balance. Available balance: KES ${wallet.availableBalance}`
      );
    }

    return {
      valid: true,

      amount:
        this.roundMoney(amount),

      availableBalance:
        wallet.availableBalance,

      currency,
    };
  }

  // ============================================================
  // GET WALLET TRANSACTIONS
  //
  // Returns earnings and withdrawals.
  // ============================================================

  async getTransactions(
    developerId,
    {
      page = 1,
      limit = 20,
      type = null,
    } = {}
  ) {
    if (!developerId) {
      throw new Error(
        "Developer ID is required"
      );
    }

    const safePage =
      Math.max(1, Number(page));

    const safeLimit =
      Math.min(
        100,
        Math.max(1, Number(limit))
      );

    const skip =
      (safePage - 1) *
      safeLimit;

    const query = {
      developer: developerId,

      type: {
        $in: [
          "milestone_release",
          "withdrawal",
          "refund",
        ],
      },
    };

    if (type) {
      query.type = type;
    }

    const [
      transactions,
      total,
    ] = await Promise.all([
      Transaction.find(query)
        .populate(
          "job",
          "title currency"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(safeLimit)
        .lean(),

      Transaction.countDocuments(query),
    ]);

    return {
      transactions,

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
  // GET WALLET SUMMARY
  // ============================================================

  async getSummary(developerId) {
    const wallet =
      await this.getBalance(
        developerId
      );

    const [
      pendingWithdrawals,
      completedWithdrawals,
      earningsCount,
    ] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            developer:
              new mongoose.Types.ObjectId(
                developerId
              ),

            type: "withdrawal",

            status: {
              $in: [
                "pending",
                "processing",
              ],
            },
          },
        },

        {
          $group: {
            _id: null,

            total: {
              $sum:
                "$developerAmount",
            },

            count: {
              $sum: 1,
            },
          },
        },
      ]),

      Transaction.aggregate([
        {
          $match: {
            developer:
              new mongoose.Types.ObjectId(
                developerId
              ),

            type: "withdrawal",

            status: "completed",
          },
        },

        {
          $group: {
            _id: null,

            total: {
              $sum:
                "$developerAmount",
            },

            count: {
              $sum: 1,
            },
          },
        },
      ]),

      Transaction.countDocuments({
        developer: developerId,

        type: "milestone_release",

        status: "completed",
      }),
    ]);

    return {
      balance: wallet,

      earnings: {
        totalEarned:
          wallet.totalEarned,

        completedPayments:
          earningsCount,
      },

      withdrawals: {
        pendingAmount:
          this.roundMoney(
            pendingWithdrawals[0]
              ?.total || 0
          ),

        pendingCount:
          pendingWithdrawals[0]
            ?.count || 0,

        completedAmount:
          this.roundMoney(
            completedWithdrawals[0]
              ?.total || 0
          ),

        completedCount:
          completedWithdrawals[0]
            ?.count || 0,
      },
    };
  }

  // ============================================================
  // GET JOB EARNINGS
  //
  // Useful for developer dashboards.
  // ============================================================

  async getJobEarnings(
    developerId,
    jobId
  ) {
    if (!developerId || !jobId) {
      throw new Error(
        "Developer ID and Job ID are required"
      );
    }

    const transactions =
      await Transaction.find({
        developer: developerId,

        job: jobId,

        type: "milestone_release",

        status: "completed",
      })
        .populate(
          "job",
          "title currency budget"
        )
        .sort({
          createdAt: 1,
        })
        .lean();

    const totalEarned =
      transactions.reduce(
        (total, transaction) =>
          total +
          (transaction.developerAmount ||
            0),
        0
      );

    return {
      jobId,

      totalEarned:
        this.roundMoney(
          totalEarned
        ),

      transactions,
    };
  }

  // ============================================================
  // GET PENDING WITHDRAWALS
  // ============================================================

  async getPendingWithdrawals(
    developerId
  ) {
    return Transaction.find({
      developer: developerId,

      type: "withdrawal",

      status: {
        $in: [
          "pending",
          "processing",
        ],
      },
    })
      .sort({
        createdAt: -1,
      })
      .lean();
  }

  // ============================================================
  // MONEY ROUNDING
  // ============================================================

  roundMoney(amount) {
    return (
      Math.round(
        (Number(amount) || 0) * 100
      ) / 100
    );
  }
}

export default new WalletService();
