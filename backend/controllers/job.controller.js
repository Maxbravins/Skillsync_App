// backend/controllers/job.controller.js

import Job from "../models/job.model.js";
import Application from "../models/application.model.js";
import Contract from "../models/contract.model.js";

import {
  calculatePlatformFee,
} from "../services/platformFee.service.js";

// ============================================================
// CREATE JOB
// ============================================================

export const createJob = async (req, res) => {
  try {
    const {
  title,
  description,
  budget,
  skills = [],
  category,
  experienceLevel,
  projectType,
  workMode,
  applicationDeadline,
} = req.body;

    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Job title is required",
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Job description is required",
      });
    }

    const numericBudget = Number(budget);

    if (
      !Number.isFinite(numericBudget) ||
      numericBudget <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Budget must be greater than zero",
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Job category is required",
      });
    }

    // ----------------------------------------------------------
    // PLATFORM FEE
    // ----------------------------------------------------------

    const platformFee =
      calculatePlatformFee(numericBudget);

    const clientTotalAmount =
      numericBudget + platformFee;

    // ----------------------------------------------------------
    // CREATE JOB
    // ----------------------------------------------------------

    const job = await Job.create({
      title: title.trim(),

      description: description.trim(),

      budget: numericBudget,

      platformFeeAmount: platformFee,

      clientTotalAmount,

      currency: "KES",

      skills: Array.isArray(skills)
        ? skills
        : [],

      category,

      experienceLevel,

      projectType,

      workMode,
      applicationDeadline: applicationDeadline
      ? new Date(applicationDeadline)
      : undefined,

      client: req.user.id,

      // Job cannot be visible to developers
      // until required payment is completed.
      isPublished: false,

      paymentStatus: "pending",

      status: "Open",
    });

    return res.status(201).json({
      success: true,
      message:
        "Job created successfully. Complete the platform fee payment to publish the job.",

      job,
    });
  } catch (error) {
    console.error(
      "Create job error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to create job",
    });
  }
};

// ============================================================
// GET ALL PUBLISHED JOBS
// ============================================================

export const getAllJobs = async (
  req,
  res
) => {
  try {
    const page =
      Math.max(
        parseInt(req.query.page) || 1,
        1
      );

    const limit =
      Math.min(
        Math.max(
          parseInt(req.query.limit) || 10,
          1
        ),
        100
      );

    const skip =
      (page - 1) * limit;

    const filter = {
      isPublished: true,
      status: "Open",
    };

    const [
      jobs,
      total,
    ] = await Promise.all([
      Job.find(filter)
        .populate(
          "client",
          "username email profilePicture"
        )
        .populate(
          "category",
          "name"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit),

      Job.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,

      count: jobs.length,

      total,

      page,

      limit,

      totalPages:
        Math.ceil(total / limit),

      jobs,
    });
  } catch (error) {
    console.error(
      "Get all jobs error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch jobs",
    });
  }
};

// ============================================================
// GET JOB BY ID
// ============================================================

export const getJobById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id)
      .populate(
        "client",
        "username email profilePicture company"
      )
      .populate(
        "category",
        "name"
      );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // ----------------------------------------------------------
    // PRIVATE UNPUBLISHED JOB
    // ----------------------------------------------------------

    if (!job.isPublished) {
      const isOwner =
        req.user &&
        job.client._id.toString() ===
          req.user.id.toString();

      const isAdmin =
        req.user &&
        req.user.role === "admin";

      if (!isOwner && !isAdmin) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }
    }

    return res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    console.error(
      "Get job by ID error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch job",
    });
  }
};

// ============================================================
// UPDATE JOB
// ============================================================

export const updateJob = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // ----------------------------------------------------------
    // AUTHORIZATION
    // ----------------------------------------------------------

    if (
      job.client.toString() !==
      req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to update this job",
      });
    }

    // ----------------------------------------------------------
    // DON'T ALLOW PAYMENT FIELDS TO BE MODIFIED
    // ----------------------------------------------------------

    const allowedFields = [
      "title",
      "description",
      "skills",
      "category",
      "experienceLevel",
      "projectType",
      "workMode",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (
        req.body[field] !==
        undefined
      ) {
        updates[field] =
          req.body[field];
      }
    }

    if (
      updates.title !== undefined
    ) {
      if (
        !String(
          updates.title
        ).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Job title cannot be empty",
        });
      }

      updates.title =
        String(
          updates.title
        ).trim();
    }

    if (
      updates.description !==
      undefined
    ) {
      if (
        !String(
          updates.description
        ).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Job description cannot be empty",
        });
      }

      updates.description =
        String(
          updates.description
        ).trim();
    }

    // ----------------------------------------------------------
    // BUDGET CHANGE
    // ----------------------------------------------------------

    if (
      req.body.budget !==
      undefined
    ) {
      const newBudget =
        Number(
          req.body.budget
        );

      if (
        !Number.isFinite(
          newBudget
        ) ||
        newBudget <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Budget must be greater than zero",
        });
      }

      /*
       * Once a job has been paid for,
       * changing the budget would make
       * the original payment inconsistent.
       */
      if (
        job.paymentStatus ===
          "paid" ||
        job.paymentStatus ===
          "escrow"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Budget cannot be changed after payment has been completed",
        });
      }

      const platformFee =
        calculatePlatformFee(
          newBudget
        );

      updates.budget =
        newBudget;

      updates.platformFeeAmount =
        platformFee;

      updates.clientTotalAmount =
        newBudget +
        platformFee;
    }

    const updatedJob =
      await Job.findByIdAndUpdate(
        id,
        {
          $set: updates,
        },
        {
          new: true,
          runValidators: true,
        }
      )
        .populate(
          "client",
          "username email profilePicture"
        )
        .populate(
          "category",
          "name"
        );

    return res.status(200).json({
      success: true,
      message:
        "Job updated successfully",
      job: updatedJob,
    });
  } catch (error) {
    console.error(
      "Update job error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to update job",
    });
  }
};

// ============================================================
// DELETE JOB
// ============================================================

export const deleteJob = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const job =
      await Job.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // ----------------------------------------------------------
    // AUTHORIZATION
    // ----------------------------------------------------------

    if (
      job.client.toString() !==
      req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to delete this job",
      });
    }

    // ----------------------------------------------------------
    // DON'T DELETE ACTIVE WORK
    // ----------------------------------------------------------

    if (
      [
        "Filled",
        "In Progress",
        "Completed",
      ].includes(job.status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This job cannot be deleted because work has already started or been completed",
      });
    }

    // ----------------------------------------------------------
    // DON'T DELETE JOB WITH ACTIVE CONTRACT
    // ----------------------------------------------------------

    const activeContract =
      await Contract.findOne({
        job: job._id,
        status: {
          $in: [
            "pending",
            "active",
          ],
        },
      });

    if (activeContract) {
      return res.status(400).json({
        success: false,
        message:
          "This job cannot be deleted while it has an active contract",
      });
    }

    // ----------------------------------------------------------
    // DELETE APPLICATIONS
    // ----------------------------------------------------------

    await Application.deleteMany({
      job: job._id,
    });

    await job.deleteOne();

    return res.status(200).json({
      success: true,
      message:
        "Job deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete job error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to delete job",
    });
  }
};

// ============================================================
// GET MY JOBS
// ============================================================

export const getMyJobs = async (
  req,
  res
) => {
  try {
    const page =
      Math.max(
        parseInt(req.query.page) || 1,
        1
      );

    const limit =
      Math.min(
        Math.max(
          parseInt(
            req.query.limit
          ) || 10,
          1
        ),
        100
      );

    const skip =
      (page - 1) * limit;

    const filter = {
      client: req.user.id,
    };

    const [
      jobs,
      total,
    ] = await Promise.all([
      Job.find(filter)
        .populate(
          "category",
          "name"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit),

      Job.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,

      count: jobs.length,

      total,

      page,

      limit,

      totalPages:
        Math.ceil(total / limit),

      jobs,
    });
  } catch (error) {
    console.error(
      "Get my jobs error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch your jobs",
    });
  }
};

// ============================================================
// GET JOB STATS
// ============================================================

export const getJobStats = async (
  req,
  res
) => {
  try {
    /*
     * Clients should see statistics
     * for their own jobs.
     *
     * Admin can see platform-wide stats.
     */

    const filter =
      req.user.role === "admin"
        ? {}
        : {
            client: req.user.id,
          };

    const [
      statusStats,
      totalJobs,
      openJobs,
      publishedJobs,
      totalBudget,
    ] = await Promise.all([
      Job.aggregate([
        {
          $match: filter,
        },
        {
          $group: {
            _id: "$status",

            count: {
              $sum: 1,
            },

            averageBudget: {
              $avg: "$budget",
            },
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
      ]),

      Job.countDocuments(
        filter
      ),

      Job.countDocuments({
        ...filter,
        status: "Open",
      }),

      Job.countDocuments({
        ...filter,
        isPublished: true,
      }),

      Job.aggregate([
        {
          $match: filter,
        },
        {
          $group: {
            _id: null,

            total: {
              $sum: "$budget",
            },
          },
        },
      ]),
    ]);

    return res.status(200).json({
      success: true,

      stats: {
        total: totalJobs,

        open: openJobs,

        published: publishedJobs,

        byStatus: statusStats,

        totalBudget:
          totalBudget[0]?.total ||
          0,
      },
    });
  } catch (error) {
    console.error(
      "Get job stats error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to get job statistics",
    });
  }
};

// ============================================================
// SEARCH JOBS
// ============================================================

export const searchJobs = async (
  req,
  res
) => {
  try {
    const {
      q,
      category,
      minBudget,
      maxBudget,
      skills,
      experienceLevel,
      projectType,
      workMode,
    } = req.query;

    const page =
      Math.max(
        parseInt(
          req.query.page
        ) || 1,
        1
      );

    const limit =
      Math.min(
        Math.max(
          parseInt(
            req.query.limit
          ) || 10,
          1
        ),
        100
      );

    const filter = {
      status: "Open",
      isPublished: true,
    };

    // ----------------------------------------------------------
    // TEXT SEARCH
    // ----------------------------------------------------------

    if (
      q &&
      q.trim()
    ) {
      filter.$text = {
        $search:
          q.trim(),
      };
    }

    // ----------------------------------------------------------
    // CATEGORY
    // ----------------------------------------------------------

    if (category) {
      filter.category =
        category;
    }

    // ----------------------------------------------------------
    // BUDGET
    // ----------------------------------------------------------

    if (
      minBudget !==
        undefined ||
      maxBudget !==
        undefined
    ) {
      filter.budget = {};

      if (
        minBudget !==
        undefined
      ) {
        const min =
          Number(
            minBudget
          );

        if (
          !Number.isFinite(
            min
          ) ||
          min < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid minimum budget",
          });
        }

        filter.budget.$gte =
          min;
      }

      if (
        maxBudget !==
        undefined
      ) {
        const max =
          Number(
            maxBudget
          );

        if (
          !Number.isFinite(
            max
          ) ||
          max < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid maximum budget",
          });
        }

        filter.budget.$lte =
          max;
      }
    }

    // ----------------------------------------------------------
    // SKILLS
    // ----------------------------------------------------------

    if (
      skills &&
      skills.trim()
    ) {
      const skillsArray =
        skills
          .split(",")
          .map(
            (skill) =>
              skill.trim()
          )
          .filter(Boolean);

      if (
        skillsArray.length
      ) {
        filter.skills = {
          $in: skillsArray,
        };
      }
    }

    // ----------------------------------------------------------
    // OTHER FILTERS
    // ----------------------------------------------------------

    if (experienceLevel) {
      filter.experienceLevel =
        experienceLevel;
    }

    if (projectType) {
      filter.projectType =
        projectType;
    }

    if (workMode) {
      filter.workMode =
        workMode;
    }

    // ----------------------------------------------------------
    // QUERY
    // ----------------------------------------------------------

    const skip =
      (page - 1) * limit;

    const [
      jobs,
      total,
    ] = await Promise.all([
      Job.find(filter)
        .populate(
          "client",
          "username email profilePicture company"
        )
        .populate(
          "category",
          "name"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit),

      Job.countDocuments(
        filter
      ),
    ]);

    return res.status(200).json({
      success: true,

      data: jobs,

      pagination: {
        page,
        limit,
        total,

        pages:
          Math.ceil(
            total / limit
          ),
      },
    });
  } catch (error) {
    console.error(
      "Search jobs error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to search jobs",
    });
  }
};
