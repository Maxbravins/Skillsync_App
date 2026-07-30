import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getJobById, updateJob } from "../../services/job.service";
import Navbar from "../../components/Navbar";

const EditJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    skills: "",
  });

  const fetchJob = useCallback(async () => {
    try {
      const data = await getJobById(id);
      if (data.job) {
        setFormData({
          title: data.job.title || "",
          description: data.job.description || "",
          budget: data.job.budget || "",
          skills: data.job.skills ? data.job.skills.join(", ") : "",
        });
      }
    } catch (error) {
      console.log(error);
    }
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await updateJob(id, {
        ...formData,
        skills: formData.skills.split(",").map((s) => s.trim()),
      });

      alert("Job updated successfully!");
      navigate("/my-jobs");
    } catch (error) {
      console.log(error);
      alert("Failed to update job.");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
      <Navbar />
      <div className="max-w-3xl mx-auto p-6 py-10">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow rounded-xl p-8">
          <h1 className="text-2xl font-bold mb-6">Edit Job</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1">Job Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Job Title"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] p-3 rounded-lg outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Description"
                rows="5"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] p-3 rounded-lg outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Budget (KES)</label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                placeholder="Budget"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] p-3 rounded-lg outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Required Skills (comma separated)</label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="React, Node.js, MongoDB"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] p-3 rounded-lg outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 font-semibold transition"
            >
              Update Job
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditJob;
