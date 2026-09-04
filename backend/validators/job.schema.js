// backend/validators/job.schema.js
import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.string().min(1, "Category is required"),
  budget: z.number().min(1, "Budget must be greater than 0"),
  skills: z.array(z.string()).min(1, "At least one skill is required"),
  experienceLevel: z.enum(["Entry Level", "Intermediate", "Senior"]).optional(),
  projectType: z.enum(["Fixed Price", "Hourly", "Contract", "Internship"]).optional(),
  workMode: z.enum(["Remote", "Hybrid", "Onsite"]).optional(),
  deadline: z.string().datetime().optional(),
});

export const updateJobSchema = createJobSchema.partial();