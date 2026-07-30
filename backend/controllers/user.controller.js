import Profile from "../models/profile.model.js";

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