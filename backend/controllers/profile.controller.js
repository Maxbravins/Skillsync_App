import User from "../models/user.model.js";

export const updateProfile = async (req, res) => {
  try {
    const updates = {};

    // Only update provided fields
    if (req.body.username !== undefined)
      updates.username = req.body.username;

    if (req.body.bio !== undefined)
      updates.bio = req.body.bio;

    if (req.body.phone !== undefined)
      updates.phone = req.body.phone;

    if (req.body.location !== undefined)
      updates.location = req.body.location;

    if (req.body.website !== undefined)
      updates.website = req.body.website;

    if (req.body.github !== undefined)
      updates.github = req.body.github;

    if (req.body.linkedin !== undefined)
      updates.linkedin = req.body.linkedin;

    if (req.body.portfolio !== undefined)
      updates.portfolio = req.body.portfolio;

    if (req.body.company !== undefined)
      updates.company = req.body.company;

    if (req.body.companyWebsite !== undefined)
      updates.companyWebsite = req.body.companyWebsite;

    if (req.body.experience !== undefined)
      updates.experience = Number(req.body.experience);

    if (req.body.skills) {
      updates.skills = req.body.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0);
    }

    // Uploaded profile picture
    if (req.files?.profilePicture?.length) {
      updates.profilePicture =
        "/uploads/profiles/" + req.files.profilePicture[0].filename;
    }

    // Uploaded resume
    if (req.files?.resume?.length) {
      updates.resume =
        "/uploads/resumes/" + req.files.resume[0].filename;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};