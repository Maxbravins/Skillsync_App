import Job from "../models/job.model.js";

// Create a new job
export const createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      budget,
      skills,
      category,
    } = req.body;

    const platformFee = budget * 0.10;
    const totalAmount = budget + platformFee;

    const job = await Job.create({
      title,
      description,
      budget,
      platformFee,
      totalAmount,
      paymentStatus: "pending",
      isPublished: false,
      skills,
      category,
      client: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Job created successfully. Pay the platform fee to publish it.",
      job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all jobs
export const getAllJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Job.countDocuments({
      isPublished: true,
    });

    const jobs = await Job.find({
      isPublished: true,
    })
      .populate("client", "username email")
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: jobs.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get job by ID
export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate("client", "username email")
      .populate("category", "name");

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update job by ID (only by the job owner)
export const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.client.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this job",
      });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Job updated successfully",
      job: updatedJob,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete job by ID
export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.client.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this job",
      });
    }

    await job.deleteOne();

    res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get my jobs (for clients)
export const getMyJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Job.countDocuments({ client: req.user.id });

    const jobs = await Job.find({
      client: req.user.id,
    })
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: jobs.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
    });
  }
};

  //  GET JOB STATS (NEW)
export const getJobStats = async (req, res) => {
  try {
    const stats = await Job.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          averageBudget: { $avg: "$budget" },
        },
      },
    ]);

    const totalJobs = await Job.countDocuments();
    const openJobs = await Job.countDocuments({ status: "Open" });
    const totalBudget = await Job.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$budget" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total: totalJobs,
        open: openJobs,
        byStatus: stats,
        totalBudget: totalBudget[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("Get job stats error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get job stats",
    });
  }
};


// SEARCH JOBS

export const searchJobs = async (req, res) => {
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
      page = 1,
      limit = 10,
    } = req.query;

    const filter = { status: "Open", isPublished: true };

    // Text search
    if (q) {
      filter.$text = { $search: q };
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Budget range
    if (minBudget || maxBudget) {
      filter.budget = {};
      if (minBudget) filter.budget.$gte = parseInt(minBudget);
      if (maxBudget) filter.budget.$lte = parseInt(maxBudget);
    }

    // Skills filter
    if (skills) {
      const skillsArray = skills.split(",").map(s => s.trim());
      filter.skills = { $in: skillsArray };
    }

    // Experience level
    if (experienceLevel) {
      filter.experienceLevel = experienceLevel;
    }

    // Project type
    if (projectType) {
      filter.projectType = projectType;
    }

    // Work mode
    if (workMode) {
      filter.workMode = workMode;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate("client", "username email profilePicture company")
        .populate("category", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Job.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Search jobs error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to search jobs",
    });
  }
};

