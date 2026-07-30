import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createJob } from "../../services/job.service";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const CreateJob = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    skills: "",
  });

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
        skills: formData.skills
          .split(",")
          .map((skill) => skill.trim()),
      });

      alert("Job created successfully!");
      navigate("/my-jobs");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to create job"
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans transition-colors">
      <Navbar />
    <div className="max-w-3xl mx-auto p-6">
      <div
        className="p-6 rounded-xl shadow-lg"
        style={{
          backgroundColor: "var(--bg-card)",
          color: "var(--text-primary)",
        }}
      >
        <h1 className="text-3xl font-bold mb-6">
          Create New Job
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            name="title"
            placeholder="Job Title"
            value={formData.title}
            onChange={handleChange}
            className="w-full rounded-lg p-3 border"
            style={{
              backgroundColor: "var(--bg-secondary)",
              color: "var(--text-primary)",
              borderColor: "var(--border-color)",
            }}
            required
          />

          <textarea
            name="description"
            placeholder="Job Description"
            value={formData.description}
            onChange={handleChange}
            rows={5}
            className="w-full rounded-lg p-3 border"
            style={{
              backgroundColor: "var(--bg-secondary)",
              color: "var(--text-primary)",
              borderColor: "var(--border-color)",
            }}
            required
          />

          <input
            type="number"
            name="budget"
            placeholder="Budget"
            value={formData.budget}
            onChange={handleChange}
            className="w-full rounded-lg p-3 border"
            style={{
              backgroundColor: "var(--bg-secondary)",
              color: "var(--text-primary)",
              borderColor: "var(--border-color)",
            }}
            required
          />

          <input
            type="text"
            name="skills"
            placeholder="React, Node.js, MongoDB"
            value={formData.skills}
            onChange={handleChange}
            className="w-full rounded-lg p-3 border"
            style={{
              backgroundColor: "var(--bg-secondary)",
              color: "var(--text-primary)",
              borderColor: "var(--border-color)",
            }}
            required
          />

          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition"
          >
            Create Job
          </button>
        </form>
      </div>
      </div>
      <Footer />
    </div>  
  );
};

export default CreateJob;