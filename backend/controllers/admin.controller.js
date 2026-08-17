import User from "../models/user.model.js";
import Job from "../models/job.model.js";
import Application from "../models/application.model.js";
import Transaction from "../models/transaction.model.js";

// ======================================================
// ADMIN DASHBOARD STATISTICS
// ======================================================
export const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalClients,
      totalDevelopers,
      totalAdmins,
      premiumUsers,
      totalJobs,
      publishedJobs,
      pendingJobs,
      totalApplications,
      completedTransactions,
      pendingTransactions,
      failedTransactions,
    ] = await Promise.all([
      User.countDocuments(),

      User.countDocuments({
        role: "client",
      }),

      User.countDocuments({
        role: "developer",
      }),

      User.countDocuments({
        role: "admin",
      }),

      User.countDocuments({
        isPremium: true,
        premiumExpiresAt: {
          $gt: new Date(),
        },
      }),

      Job.countDocuments(),

      Job.countDocuments({
        isPublished: true,
      }),

      Job.countDocuments({
        isPublished: { $ne: true },
      }),

      Application.countDocuments(),

      Transaction.countDocuments({
        status: "completed",
      }),

      Transaction.countDocuments({
        status: "pending",
      }),

      Transaction.countDocuments({
        status: "failed",
      }),
    ]);

    // ==================================================
    // REVENUE
    // ==================================================

    const revenueResult = await Transaction.aggregate([
      {
        $match: {
          status: "completed",
        },
      },
      {
        $group: {
          _id: "$paymentType",
          total: {
            $sum: "$amount",
          },
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    let premiumRevenue = 0;
    let platformFeeRevenue = 0;
    let projectPaymentRevenue = 0;
    let withdrawalAmount = 0;

    revenueResult.forEach((item) => {
      switch (item._id) {
        case "premium":
          premiumRevenue = item.total;
          break;

        case "platform_fee":
          platformFeeRevenue = item.total;
          break;

        case "project_payment":
          projectPaymentRevenue = item.total;
          break;

        case "withdrawal":
          withdrawalAmount = item.total;
          break;

        default:
          break;
      }
    });

    // SkillSync revenue
    const totalRevenue =
      premiumRevenue +
      platformFeeRevenue;

    // Total money processed through the platform
    const totalProcessed =
      premiumRevenue +
      platformFeeRevenue +
      projectPaymentRevenue;

    res.status(200).json({
      success: true,

      stats: {
        // USERS
        totalUsers,
        totalClients,
        totalDevelopers,
        totalAdmins,
        premiumUsers,

        // JOBS
        totalJobs,
        publishedJobs,
        pendingJobs,

        // APPLICATIONS
        totalApplications,

        // TRANSACTIONS
        completedTransactions,
        pendingTransactions,
        failedTransactions,

        // REVENUE
        premiumRevenue,
        platformFeeRevenue,
        projectPaymentRevenue,
        withdrawalAmount,

        // SkillSync's actual revenue
        totalRevenue,

        // Total money processed
        totalProcessed,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET ALL USERS
// ======================================================
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET ALL JOBS
// ======================================================
export const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate("client", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error("Get jobs error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// DELETE USER
// ======================================================
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent deleting an admin account
    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot be deleted here.",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// DELETE JOB
// ======================================================
export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("Delete job error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET RECENT TRANSACTIONS
// ======================================================
export const getRecentTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("client", "username email")
      .populate("developer", "username email")
      .populate("user", "username email")
      .populate("job", "title")
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error("Get transactions error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};