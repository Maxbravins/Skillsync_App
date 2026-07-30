import Application from "../models/application.model.js";
import Job from "../models/job.model.js";

export const getDeveloperDashboard = async (req, res) => {

  try {
    const applications = await Application.find({
      developer: req.user.id,
    });

    const totalApplications = applications.length;

    const pendingApplications = applications.filter(
      (app) => app.status === "pending"
    ).length;

    const acceptedApplications = applications.filter(
      (app) => app.status === "accepted"
    ).length;

    const rejectedApplications = applications.filter(
      (app) => app.status === "rejected"
    ).length;

    res.status(200).json({
      success: true,
      dashboard: {
        totalApplications,
        pendingApplications,
        acceptedApplications,
        rejectedApplications,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getClientDashboard = async (req, res) => {

  try {
    // Get all jobs posted by this client
    const jobs = await Job.find({
      client: req.user.id,
    });

    const totalJobs = jobs.length;

    // Get job IDs
    const jobIds = jobs.map((job) => job._id);

    // Get all applications for those jobs
    
    const applications = await Application.find({
      job: { $in: jobIds },
    });

    const totalApplications = applications.length;

    const acceptedApplications = applications.filter(
      (app) => app.status === "accepted"
    ).length;

    const rejectedApplications = applications.filter(
      (app) => app.status === "rejected"
    ).length;

    const pendingApplications = applications.filter(
      (app) => app.status === "pending"
    ).length;

    res.status(200).json({
      success: true,
      dashboard: {
        totalJobs,
        totalApplications,
        acceptedApplications,
        rejectedApplications,
        pendingApplications,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};