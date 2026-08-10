import Profile from "../models/profile.model.js";
import User from "../models/user.model.js";
import Job from "../models/job.model.js";
import Application from "../models/application.model.js";

export const createProfile = async (req, res) => {
  try {
    const { bio, skills, github, linkedin, portfolio } = req.body;
    const existingProfile = await Profile.findOne({
      user: req.user.id,
    });
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: "Profile already exists",
      });
    }
    const profile = await Profile.create({
      user: req.user.id,
      bio,
      skills,
      github,
      linkedin,
      portfolio,
    });
    res.status(201).json({
      success: true,
      message: "Profile created successfully",
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      "bio",
      "phone",
      "location",
      "website",
      "skills",
      "experience",
      "github",
      "linkedin",
      "portfolio",
      "company",
      "companyWebsite",
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (updates.skills && typeof updates.skills === "string") {
      try {
        updates.skills = JSON.parse(updates.skills);
      } catch {
        updates.skills = updates.skills.split(",").map((s) => s.trim());
      }
    }

    if (req.files?.profilePicture?.[0]) {
      updates.profilePicture = `/uploads/profiles/${req.files.profilePicture[0].filename}`;
    }

    if (req.files?.resume?.[0]) {
      updates.resume = `/uploads/resumes/${req.files.resume[0].filename}`;
    }

    const user = await User.findByIdAndUpdate(
        req.user.id,
        updates,
        {
          returnDocument: "after",
          runValidators: true,
        }
        ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let jobsPosted = 0;
    let applications = 0;

    if (user.role === "client") {

      const jobs = await Job.find({
        client: user._id,
      });

      jobsPosted = jobs.length;

      const jobIds = jobs.map(job => job._id);

      applications = await Application.countDocuments({
        job: {
          $in: jobIds,
        },
      });

    } else {

      applications =
        await Application.countDocuments({
          developer: user._id,
        });

    }

    res.json({
      success: true,
      user,
      stats: {
        jobsPosted,
        applications,
      },
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};