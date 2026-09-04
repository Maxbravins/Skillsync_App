// backend/routes/job.routes.js
import express from "express";
import auth from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import { paginate } from "../middleware/pagination.js";
import { validateObjectId } from "../middleware/validate.js";
import validate from "../middleware/validate.js";
import Job from "../models/job.model.js";

import {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  getMyJobs,
  searchJobs, 
  getJobStats, 
} from "../controllers/job.controller.js";

import {
  createJobSchema,
  updateJobSchema,
} from "../validators/job.schema.js";

const router = express.Router();

// ============================================
// PUBLIC ROUTES (No auth required - browse jobs)
// ============================================
router.get("/", paginate(Job), getAllJobs);
router.get("/search", searchJobs); // ← ADD
router.get("/stats", getJobStats); // ← ADD

// ============================================
// PROTECTED ROUTES (Auth required)
// ============================================

// Client routes
router.post("/", auth, authorizeRoles("client"), validate(createJobSchema), createJob); // ← Added validation
router.put("/:id", auth, authorizeRoles("client"), validateObjectId("id"), validate(updateJobSchema), updateJob); // ← Added validation
router.delete("/:id", auth, authorizeRoles("client"), validateObjectId("id"), deleteJob); // ← Added validation
router.get("/my", auth, authorizeRoles("client"), getMyJobs);

// Anyone authenticated can view job details
router.get("/:id", auth, validateObjectId("id"), getJobById);

export default router;