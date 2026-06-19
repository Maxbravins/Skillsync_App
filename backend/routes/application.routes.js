import express from "express";
import auth from "../middleware/auth.middleware.js";
import { applyForJob, getJobApplications, getMyApplications,   updateApplicationStatus } from "../controllers/application.controller.js";
import authorizeRoles from "../middleware/role.middleware.js";

const router = express.Router();

router.get("/my", auth, getMyApplications);
router.post("/apply/:jobId", auth, authorizeRoles("developer"), applyForJob);
router.put("/:applicationId/status", auth, authorizeRoles("client"), updateApplicationStatus);
router.get("/job/:jobId", auth, authorizeRoles("client"), getJobApplications);



export default router;