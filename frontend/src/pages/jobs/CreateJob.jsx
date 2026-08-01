import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import { useLanguage } from "../../context/LanguageContext";
import { createJob } from "../../services/job.service";

const CreateJob = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    category: "",
    skills: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:5000/api/categories"
      );

      setCategories(data.categories || data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await createJob({
        title: formData.title,
        description: formData.description,
        budget: Number(formData.budget),
        category: formData.category,
        skills: formData.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
      });

      alert("Job posted successfully.");

      navigate("/my-jobs");

    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to create job."
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">

      <Navbar />

      <div className="max-w-3xl mx-auto p-6 w-full">

        <div
          className="rounded-xl shadow-lg p-6"
          style={{
            backgroundColor: "var(--bg-card)",
          }}
        >

          <h1 className="text-3xl font-bold mb-8">
            Create New Job
          </h1>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            <input
              type="text"
              name="title"
              placeholder="Job Title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg border"
            />

            <textarea
              name="description"
              rows="5"
              placeholder="Describe this project..."
              value={formData.description}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg border"
            />

            <input
              type="number"
              name="budget"
              placeholder="Budget (KES)"
              value={formData.budget}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg border"
            />

            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg border"
            >

              <option value="">
                Select Category
              </option>

              {categories.map((category) => (

                <option
                  key={category._id}
                  value={category._id}
                >
                  {category.name}
                </option>

              ))}

            </select>

            <input
              type="text"
              name="skills"
              placeholder="React, Node.js, MongoDB..."
              value={formData.skills}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg border"
            />

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-semibold"
            >
              Post Job
            </button>

          </form>

        </div>

      </div>

      <Footer />

    </div>
  );
};

export default CreateJob;