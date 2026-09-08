// backend/controllers/profile.controller.js

import User from "../models/user.model.js";

// ============================================================
// UPDATE PROFILE
// ============================================================

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // ----------------------------------------------------------
    // FIND USER
    // ----------------------------------------------------------

    const existingUser = await User.findById(userId).select("+password");

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updates = {};

    // ==========================================================
    // BASIC PROFILE INFORMATION
    // ==========================================================

    if (req.body.username !== undefined) {
      const username = String(req.body.username).trim();

      if (username.length < 3) {
        return res.status(400).json({
          success: false,
          message: "Username must be at least 3 characters long",
        });
      }

      if (username.length > 30) {
        return res.status(400).json({
          success: false,
          message: "Username cannot exceed 30 characters",
        });
      }

      updates.username = username;
    }

    if (req.body.bio !== undefined) {
      const bio = String(req.body.bio).trim();

      if (bio.length > 500) {
        return res.status(400).json({
          success: false,
          message: "Bio cannot exceed 500 characters",
        });
      }

      updates.bio = bio;
    }

    if (req.body.phone !== undefined) {
      updates.phone = String(req.body.phone).trim();
    }

    if (req.body.location !== undefined) {
      updates.location = String(req.body.location).trim();
    }

    if (req.body.website !== undefined) {
      updates.website = String(req.body.website).trim();
    }

    // ==========================================================
    // DEVELOPER INFORMATION
    // ==========================================================

    if (req.body.experience !== undefined) {
      const experience = Number(req.body.experience);

      if (!Number.isFinite(experience) || experience < 0) {
        return res.status(400).json({
          success: false,
          message: "Experience must be a valid number greater than or equal to 0",
        });
      }

      updates.experience = experience;
    }

    // ----------------------------------------------------------
    // SKILLS
    // ----------------------------------------------------------

    if (req.body.skills !== undefined) {
      let skills = req.body.skills;

      // FormData sends skills as a string.
      // Also support JSON arrays if sent by another client.

      if (typeof skills === "string") {
        const trimmedSkills = skills.trim();

        if (!trimmedSkills) {
          skills = [];
        } else {
          try {
            const parsedSkills = JSON.parse(trimmedSkills);

            if (Array.isArray(parsedSkills)) {
              skills = parsedSkills;
            } else {
              skills = trimmedSkills.split(",");
            }
          } catch {
            skills = trimmedSkills.split(",");
          }
        }
      }

      if (!Array.isArray(skills)) {
        return res.status(400).json({
          success: false,
          message: "Skills must be an array or comma-separated list",
        });
      }

      skills = skills
        .map((skill) => String(skill).trim())
        .filter(Boolean);

      // Remove duplicate skills
      skills = [...new Set(skills)];

      updates.skills = skills;
    }

    // ==========================================================
    // SOCIAL LINKS
    //
    // User schema:
    //
    // socialLinks: {
    //   github,
    //   linkedin,
    //   twitter,
    //   youtube
    // }
    // ==========================================================

    const currentSocialLinks = existingUser.socialLinks?.toObject
      ? existingUser.socialLinks.toObject()
      : existingUser.socialLinks || {};

    const socialLinks = {
      ...currentSocialLinks,
    };

    let socialLinksChanged = false;

    if (req.body.github !== undefined) {
      socialLinks.github = String(req.body.github).trim();
      socialLinksChanged = true;
    }

    if (req.body.linkedin !== undefined) {
      socialLinks.linkedin = String(req.body.linkedin).trim();
      socialLinksChanged = true;
    }

    if (req.body.twitter !== undefined) {
      socialLinks.twitter = String(req.body.twitter).trim();
      socialLinksChanged = true;
    }

    if (req.body.youtube !== undefined) {
      socialLinks.youtube = String(req.body.youtube).trim();
      socialLinksChanged = true;
    }

    if (socialLinksChanged) {
      updates.socialLinks = socialLinks;
    }

    // ==========================================================
    // PORTFOLIO
    //
    // User schema expects:
    //
    // portfolio: [
    //   {
    //     title,
    //     description,
    //     imageUrl,
    //     projectUrl,
    //     technologies
    //   }
    // ]
    //
    // Do not store a simple URL/string here.
    // ==========================================================

    if (req.body.portfolio !== undefined) {
      let portfolio = req.body.portfolio;

      if (typeof portfolio === "string") {
        try {
          portfolio = JSON.parse(portfolio);
        } catch {
          return res.status(400).json({
            success: false,
            message: "Portfolio must be valid JSON",
          });
        }
      }

      if (!Array.isArray(portfolio)) {
        return res.status(400).json({
          success: false,
          message: "Portfolio must be an array",
        });
      }

      portfolio = portfolio.map((project) => ({
        title: String(project.title || "").trim(),
        description: String(project.description || "").trim(),
        imageUrl: String(project.imageUrl || "").trim(),
        projectUrl: String(project.projectUrl || "").trim(),
        technologies: Array.isArray(project.technologies)
          ? [
              ...new Set(
                project.technologies
                  .map((technology) =>
                    String(technology).trim()
                  )
                  .filter(Boolean)
              ),
            ]
          : [],
        ...(project.createdAt
          ? { createdAt: project.createdAt }
          : {}),
      }));

      // Portfolio title is required by the schema.
      const invalidProject = portfolio.find(
        (project) => !project.title
      );

      if (invalidProject) {
        return res.status(400).json({
          success: false,
          message: "Every portfolio project must have a title",
        });
      }

      updates.portfolio = portfolio;
    }

    // ==========================================================
    // CLIENT / COMPANY INFORMATION
    // ==========================================================

    if (req.body.company !== undefined) {
      updates.company = String(req.body.company).trim();
    }

    if (req.body.companyWebsite !== undefined) {
      updates.companyWebsite = String(
        req.body.companyWebsite
      ).trim();
    }

    if (req.body.companySize !== undefined) {
      const allowedCompanySizes = [
        "1-10",
        "11-50",
        "51-200",
        "201-500",
        "500+",
      ];

      const companySize = String(req.body.companySize).trim();

      if (!allowedCompanySizes.includes(companySize)) {
        return res.status(400).json({
          success: false,
          message: "Invalid company size",
        });
      }

      updates.companySize = companySize;
    }

    // ==========================================================
    // AVAILABILITY
    // ==========================================================

    if (req.body.available !== undefined) {
      let available = req.body.available;

      if (typeof available === "string") {
        available = available === "true";
      }

      if (typeof available !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "Available must be true or false",
        });
      }

      updates.available = available;
    }

    if (req.body.availabilityStatus !== undefined) {
      const allowedStatuses = [
        "available",
        "busy",
        "unavailable",
      ];

      const availabilityStatus = String(
        req.body.availabilityStatus
      ).trim();

      if (!allowedStatuses.includes(availabilityStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid availability status",
        });
      }

      updates.availabilityStatus = availabilityStatus;

      // Keep the legacy boolean in sync.
      updates.available =
        availabilityStatus === "available";
    }

    // ==========================================================
    // PROFILE PICTURE
    //
    
    if (req.files?.profilePicture?.length) {
      const file = req.files.profilePicture[0];

      updates.profilePicture =
        file.path ||
        file.secure_url ||
        file.url ||
        `/uploads/profiles/${file.filename}`;
    }

    // ==========================================================
    // RESUME
    // ==========================================================

    if (req.files?.resume?.length) {
      const file = req.files.resume[0];

      // Resumes are uploaded with Cloudinary's private ("authenticated")
      // delivery type, so `file.path`/`file.secure_url` are NOT directly
      // fetchable — only the public_id (`file.filename`) is useful,
      // paired with getResumeSignedUrl() to generate a short-lived link
      // on demand.
      updates.resume = file.filename || file.public_id || file.path;
      updates.resumeFormat = file.format || "pdf";
    }

    // ==========================================================
    // NOTHING TO UPDATE
    // ==========================================================

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No profile changes were provided",
      });
    }

    // ==========================================================
    // UPDATE USER
    // ==========================================================

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: updates,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password -resetPasswordToken -resetPasswordExpires");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ==========================================================
    // RESPONSE
    // ==========================================================

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);

    // Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err) => err.message
      );

      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update profile",
    });
  }
};

// ============================================================
// GET PROFILE
// ============================================================

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password -resetPasswordToken -resetPasswordExpires");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch profile",
    });
  }
};
