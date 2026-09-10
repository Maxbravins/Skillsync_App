import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Briefcase, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import { createJob } from "../../services/job.service";

const API_URL = "https://skillsync-api.onrender.com/api"; // Replace with your actual API URL

const CreateJob = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    category: "",
    skills: "",
  });

  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      setError("");

      const response = await fetch(`${API_URL}/categories`);

      if (!response.ok) {
        throw new Error("Failed to load categories.");
      }

      const data = await response.json();

      setCategories(
        Array.isArray(data?.categories)
          ? data.categories
          : Array.isArray(data)
            ? data
            : []
      );
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      setError("Failed to load job categories. Please try again.");
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const title = formData.title.trim();
    const description = formData.description.trim();
    const budget = Number(formData.budget);

    const skills = formData.skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    if (!title) {
      setError("Please enter a job title.");
      return;
    }

    if (!description) {
      setError("Please provide a description for the job.");
      return;
    }

    if (!Number.isFinite(budget) || budget <= 0) {
      setError("Please enter a valid budget greater than zero.");
      return;
    }

    if (!formData.category) {
      setError("Please select a job category.");
      return;
    }

    if (skills.length === 0) {
      setError("Please provide at least one required skill.");
      return;
    }

    try {
      setSubmitting(true);

      await createJob({
        title,
        description,
        budget,
        category: formData.category,
        skills,
      });

      alert("Job posted successfully.");
      navigate("/my-jobs");
    } catch (error) {
      console.error("Failed to create job:", error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to create job. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-10 lg:py-14">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 mb-4">
              <Briefcase size={16} />
              Post an opportunity
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold">
              Create New Job
            </h1>

            <p className="mt-2 text-[var(--text-secondary)]">
              Tell developers what you need and find the right person for
              your project.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-red-300">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-lg p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-semibold mb-2"
                >
                  Job Title
                </label>

                <input
                  id="title"
                  type="text"
                  name="title"
                  placeholder="e.g. Build a React Dashboard"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-60 transition"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold mb-2"
                >
                  Project Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  rows={6}
                  placeholder="Describe the project, responsibilities, requirements, and expected outcome..."
                  value={formData.description}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-60 transition resize-y"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="budget"
                    className="block text-sm font-semibold mb-2"
                  >
                    Budget (KES)
                  </label>

                  <input
                    id="budget"
                    type="number"
                    name="budget"
                    min="1"
                    step="1"
                    placeholder="e.g. 25000"
                    value={formData.budget}
                    onChange={handleChange}
                    required
                    disabled={submitting}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-60 transition"
                  />
                </div>

                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-semibold mb-2"
                  >
                    Category
                  </label>

                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    disabled={loadingCategories || submitting}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-60 transition"
                  >
                    <option value="">
                      {loadingCategories
                        ? "Loading categories..."
                        : "Select Category"}
                    </option>

                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="skills"
                  className="block text-sm font-semibold mb-2"
                >
                  Required Skills
                </label>

                <input
                  id="skills"
                  type="text"
                  name="skills"
                  placeholder="React, Node.js, MongoDB"
                  value={formData.skills}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-60 transition"
                />

                <p className="mt-2 text-xs text-[var(--text-secondary)]">
                  Separate multiple skills with commas.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting || loadingCategories}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3.5 font-semibold transition"
              >
                <CheckCircle2 size={19} />

                {submitting ? "Posting Job..." : "Post Job"}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CreateJob;
