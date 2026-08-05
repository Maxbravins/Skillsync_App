import mongoose from "mongoose";
import dotenv from "dotenv";

import Category from "../models/category.model.js";

dotenv.config();

const categories = [
  { name: "Frontend Development" },
  { name: "Backend Development" },
  { name: "Full Stack Development" },
  { name: "Mobile Development" },
  { name: "UI/UX Design" },
  { name: "Graphic Design" },
  { name: "Data Analytics" },
  { name: "Artificial Intelligence" },
  { name: "Cyber Security" },
  { name: "Cloud Computing" },
  { name: "DevOps" },
  { name: "QA Testing" },
  { name: "Game Development" },
  { name: "Technical Writing" },
  { name: "Database Administration" },
  { name: "Software Engineering" },
];

const seedCategories = async () => {
  try {

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

    await Category.deleteMany();

    await Category.insertMany(categories);

    console.log("Categories Seeded Successfully");

    process.exit();

  } catch (error) {

    console.log(error);

    process.exit(1);

  }
};

seedCategories();