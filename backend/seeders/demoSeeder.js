import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Category from "../models/category.model.js";
import Job from "../models/job.model.js";
import Application from "../models/application.model.js";
import User from "../models/user.model.js";

dotenv.config();

const demoPassword = process.env.DEMO_SEED_PASSWORD;
const demoClientEmail = "skillsync.demo.client@example.test";
const demoDeveloperEmail = "skillsync.demo.developer@example.test";

const ensureDemoUser = async ({ email, username, role, profile }) => {
  const password = await bcrypt.hash(demoPassword, 10);
  return User.findOneAndUpdate(
    { email },
    {
      $set: { username, password, role, ...profile },
      $setOnInsert: { email },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
};

const seedDemoData = async () => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Demo data seeding is disabled in production.");
  }
  if (process.env.ENABLE_DEMO_SEED !== "true") {
    throw new Error("Set ENABLE_DEMO_SEED=true to explicitly enable demo data seeding.");
  }
  if (!process.env.MONGO_URI) {
    throw new Error("Set MONGO_URI before seeding demo data.");
  }
  if (!demoPassword || demoPassword.length < 8) {
    throw new Error("Set DEMO_SEED_PASSWORD to a password of at least 8 characters.");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const [client, developer] = await Promise.all([
    ensureDemoUser({
      email: demoClientEmail,
      username: "SkillSync Demo Client",
      role: "client",
      profile: {
        company: "Northstar Studio",
        companyWebsite: "https://example.test",
        bio: "A sample client account for demonstrating the SkillSync hiring flow.",
        location: "Nairobi, Kenya",
      },
    }),
    ensureDemoUser({
      email: demoDeveloperEmail,
      username: "SkillSync Demo Developer",
      role: "developer",
      profile: {
        bio: "A sample developer profile for demonstrating applications and portfolios.",
        location: "Nairobi, Kenya",
        skills: ["React", "Node.js", "MongoDB", "UI/UX"],
        experience: 4,
        experienceLevel: "Intermediate",
        portfolio: [{
          title: "Community Learning Portal",
          description: "A demo portfolio project with course discovery and progress tracking.",
          technologies: ["React", "Node.js", "MongoDB"],
          projectUrl: "https://example.test",
        }],
      },
    }),
  ]);

  const category = await Category.findOneAndUpdate(
    { name: "Full Stack Development" },
    { $setOnInsert: { name: "Full Stack Development", description: "End-to-end web application projects." } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 30);
  const jobs = [
    {
      title: "Build a responsive marketplace dashboard",
      description: "DEMO LISTING — Build a clear dashboard for managing listings, applications, and activity. This sample job is provided for local presentation use.",
      budget: 85000,
      requiredSkills: ["React", "Tailwind CSS", "REST APIs"],
      projectType: "Fixed Price",
      experienceLevel: "Intermediate",
      estimatedDuration: "2-4 weeks",
    },
    {
      title: "Create an accessible business landing page",
      description: "DEMO LISTING — Design and implement a mobile-friendly landing page with a contact form and basic analytics. This sample job is provided for local presentation use.",
      budget: 42000,
      requiredSkills: ["HTML", "CSS", "JavaScript", "Accessibility"],
      projectType: "Fixed Price",
      experienceLevel: "Entry Level",
      estimatedDuration: "1-2 weeks",
    },
  ];

  const seededJobs = [];
  for (const item of jobs) {
    const jobData = {
      ...item,
      category: category._id,
      client: client._id,
      currency: "KES",
      applicationDeadline: deadline,
      projectDeadline: deadline,
      isPublished: true,
      status: "Open",
      platformFeePaid: true,
      paymentStatus: "pending",
    };
    const seededJob = await Job.findOneAndUpdate(
      { client: client._id, title: item.title },
      { $set: jobData },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    seededJobs.push(seededJob);
  }

  await Application.findOneAndUpdate(
    { job: seededJobs[0]._id, developer: developer._id },
    {
      $set: {
        job: seededJobs[0]._id,
        developer: developer._id,
        coverLetter: "I have built React dashboards with accessible, responsive layouts and API integrations. I would be glad to help deliver this marketplace dashboard.",
        proposedBudget: 80000,
        proposedTimeline: "3 weeks",
        status: "pending",
        paymentStatus: "unpaid",
      },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  await Job.updateOne(
    { _id: seededJobs[0]._id },
    { $set: { applicationCount: await Application.countDocuments({ job: seededJobs[0]._id }) } }
  );

  console.log("Demo accounts, sample listings, and an application are ready in this non-production database.");
  console.log(`Client: ${demoClientEmail}`);
  console.log(`Developer: ${demoDeveloperEmail}`);
  console.log("Use the password supplied in DEMO_SEED_PASSWORD.");
};

seedDemoData()
  .catch((error) => {
    console.error("Demo seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState) await mongoose.disconnect();
  });
