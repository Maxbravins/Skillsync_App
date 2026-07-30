import Application from "../models/application.model.js";
import { generateApplicationsPDF } from "../services/pdf.service.js";

export const exportApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("developer", "username email")
      .populate("job", "title");

    generateApplicationsPDF(applications, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};