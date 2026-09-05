import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import { getJobById, updateJob } from "../../services/job.service";

const EditJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    skills: "",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchJob = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getJobById(id);

      if (!data?.job) {
        setError("Job could not be found.");
        return;
      }

      setFormData({
        title: data.job.title || "",
        description: data.job.description || "",
        budget: data.job.budget ?? "",
        skills: Array.isArray(data.job.skills)
          ? data.job.skills.join(", ")
          : "",
      });
    } catch (error) {
      console.error("Failed to fetch job:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load this job. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

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
      setError("Please provide a job description.");
      return;
    }

    if (!Number.isFinite(budget) || budget <= 0) {
      setError("Please enter a valid budget greater than zero.");
      return;
    }

    if (skills.length === 0) {
      setError("Please provide at least one required skill.");
      return;
    }

    try {
      setSubmitting(true);

      await updateJob(id, {
        title,
        description,
        budget,
        skills,
      });

      alert("Job updated successfully.");
      navigate("/my-jobs");
    } catch (error) {
      console.error("Failed to update job:", error);

      setError(
        error.response?.data?.message ||
          "Failed to update job. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <Navbar />

        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <Loader2
              size={40}
              className="mx-auto mb-4 text-cyan-400 animate-spin"
            />

            <p className="text-[var(--text-secondary)]">
              Loading job...
            </p>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-10 lg:py-14">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 mb-4">
              <Briefcase size={16} />
              Manage your opportunity
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold">
              Edit Job
            </h1>

            <p className="mt-2 text-[var(--text-secondary)]">
              Update the details of your job posting.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-red-300">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-lg rounded-2xl p-6 sm:p-8">
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
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Job Title"
                  required
                  disabled={submitting}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] p-3.5 rounded-xl outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-60 transition"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold mb-2"
                >
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the project..."
                  rows={6}
                  required
                  disabled={submitting}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] p-3.5 rounded-xl outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-60 transition resize-y"
                />
              </div>

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
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="e.g. 25000"
                  required
                  disabled={submitting}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] p-3.5 rounded-xl outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-60 transition"
                />
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
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="React, Node.js, MongoDB"
                  required
                  disabled={submitting}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] p-3.5 rounded-xl outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-60 transition"
                />

                <p className="mt-2 text-xs text-[var(--text-secondary)]">
                  Separate multiple skills with commas.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3.5 rounded-xl hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed font-semibold transition"
              >
                <CheckCircle2 size={19} />

                {submitting ? "Updating Job..." : "Update Job"}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EditJob;
