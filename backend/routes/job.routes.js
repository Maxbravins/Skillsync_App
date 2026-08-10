import express from "express";
import auth from "../middleware/auth.middleware.js";
import { createJob, getAllJobs, getJobById, updateJob, deleteJob, getMyJobs } from "../controllers/job.controller.js";
import authorizeRoles from "../middleware/role.middleware.js";
import { paginate } from "../middleware/pagination.js";
import Job from "../models/job.model.js";

const router = express.Router();

router.post("/", auth, authorizeRoles("client"), createJob);
router.get("/my", auth, authorizeRoles("client"), getMyJobs);
router.get("/", auth, paginate(Job), getAllJobs);
router.get("/:id", auth, getJobById);
router.put("/:id", auth, authorizeRoles("client"), updateJob);
router.delete("/:id", auth, authorizeRoles("client"), deleteJob);


export default router;