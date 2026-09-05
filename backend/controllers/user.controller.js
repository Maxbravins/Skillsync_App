import User from "../models/user.model.js";
import Job from "../models/job.model.js";
import Application from "../models/application.model.js";

// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ----------------------------------------------------------
    // BASIC PROFILE FIELDS
    // ----------------------------------------------------------

    const allowedFields = [
      "username",
      "bio",
      "phone",
      "location",
      "website",
      "experience",
      "company",
      "companyWebsite",
      "companySize",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // ----------------------------------------------------------
    // USERNAME
    // ----------------------------------------------------------

    if (updates.username !== undefined) {
      const username = String(updates.username).trim();

      if (username.length < 3) {
        return res.status(400).json({
          success: false,
          message: "Username must be at least 3 characters",
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

    // ----------------------------------------------------------
    // BIO
    // ----------------------------------------------------------

    if (updates.bio !== undefined) {
      updates.bio = String(updates.bio).trim();

      if (updates.bio.length > 500) {
        return res.status(400).json({
          success: false,
          message: "Bio cannot exceed 500 characters",
        });
      }
    }

    // ----------------------------------------------------------
    // PHONE / LOCATION / WEBSITE
    // ----------------------------------------------------------

    if (updates.phone !== undefined) {
      updates.phone = String(updates.phone).trim();
    }

    if (updates.location !== undefined) {
      updates.location = String(updates.location).trim();
    }

    if (updates.website !== undefined) {
      updates.website = String(updates.website).trim();
    }

    // ----------------------------------------------------------
    // DEVELOPER FIELDS
    // ----------------------------------------------------------

    if (user.role === "developer") {
      if (req.body.experience !== undefined) {
        const experience = Number(req.body.experience);

        if (
          !Number.isFinite(experience) ||
          experience < 0
        ) {
          return res.status(400).json({
            success: false,
            message: "Experience must be a valid positive number",
          });
        }

        updates.experience = experience;

        // Automatically calculate experience level.
        if (experience < 2) {
          updates.experienceLevel = "Entry Level";
        } else if (experience < 5) {
          updates.experienceLevel = "Intermediate";
        } else if (experience < 8) {
          updates.experienceLevel = "Senior";
        } else {
          updates.experienceLevel = "Expert";
        }
      }

      // --------------------------------------------------------
      // SKILLS
      // --------------------------------------------------------

      if (req.body.skills !== undefined) {
        let skills = req.body.skills;

        if (typeof skills === "string") {
          try {
            const parsed = JSON.parse(skills);

            if (Array.isArray(parsed)) {
              skills = parsed;
            } else {
              skills = skills.split(",");
            }
          } catch {
            skills = skills.split(",");
          }
        }

        if (!Array.isArray(skills)) {
          return res.status(400).json({
            success: false,
            message: "Skills must be an array or comma-separated string",
          });
        }

        updates.skills = [
          ...new Set(
            skills
              .map((skill) => String(skill).trim())
              .filter(Boolean)
          ),
        ];
      }

      // --------------------------------------------------------
      // SOCIAL LINKS
      // --------------------------------------------------------

      const currentSocialLinks = user.socialLinks
        ? user.socialLinks.toObject
          ? user.socialLinks.toObject()
          : user.socialLinks
        : {};

      const socialLinks = {
        github: currentSocialLinks.github || "",
        linkedin: currentSocialLinks.linkedin || "",
        twitter: currentSocialLinks.twitter || "",
        youtube: currentSocialLinks.youtube || "",
      };

      if (req.body.github !== undefined) {
        socialLinks.github = String(req.body.github).trim();
      }

      if (req.body.linkedin !== undefined) {
        socialLinks.linkedin = String(req.body.linkedin).trim();
      }

      if (req.body.twitter !== undefined) {
        socialLinks.twitter = String(req.body.twitter).trim();
      }

      if (req.body.youtube !== undefined) {
        socialLinks.youtube = String(req.body.youtube).trim();
      }

      updates.socialLinks = socialLinks;
    }

    // ----------------------------------------------------------
    // CLIENT FIELDS
    // ----------------------------------------------------------

    if (user.role === "client") {
      if (req.body.company !== undefined) {
        updates.company = String(req.body.company).trim();
      }

      if (req.body.companyWebsite !== undefined) {
        updates.companyWebsite = String(
          req.body.companyWebsite
        ).trim();
      }

      if (req.body.companySize !== undefined) {
        updates.companySize = req.body.companySize;
      }
    }

    // ----------------------------------------------------------
    // PROFILE PICTURE
    // ----------------------------------------------------------

    if (req.files?.profilePicture?.[0]) {
      const file = req.files.profilePicture[0];

      // Cloudinary gives us the actual hosted URL.
      updates.profilePicture =
        file.path || file.secure_url || file.url;
    }

    // ----------------------------------------------------------
    // RESUME
    // ----------------------------------------------------------

    if (
      user.role === "developer" &&
      req.files?.resume?.[0]
    ) {
      const file = req.files.resume[0];

      updates.resume =
        file.path || file.secure_url || file.url;
    }

    // ----------------------------------------------------------
    // UPDATE USER
    // ----------------------------------------------------------

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: updates,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password -resetPasswordToken -resetPasswordExpires");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);

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

    let jobsPosted = 0;
    let applications = 0;

    // ----------------------------------------------------------
    // CLIENT STATS
    // ----------------------------------------------------------

    if (user.role === "client") {
      jobsPosted = await Job.countDocuments({
        client: user._id,
      });

      const jobs = await Job.find({
        client: user._id,
      }).select("_id");

      const jobIds = jobs.map((job) => job._id);

      if (jobIds.length > 0) {
        applications = await Application.countDocuments({
          job: {
            $in: jobIds,
          },
        });
      }
    }

    // ----------------------------------------------------------
    // DEVELOPER STATS
    // ----------------------------------------------------------

    if (user.role === "developer") {
      applications = await Application.countDocuments({
        developer: user._id,
      });
    }

    return res.status(200).json({
      success: true,
      user,
      stats: {
        jobsPosted,
        applications,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get profile",
    });
  }
};
