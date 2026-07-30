import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { getMyJobs, deleteJob } from "../../services/job.service";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const MyJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");

  const navigate = useNavigate();

  const fetchJobs = useCallback(async () => {
    try {
      const data = await getMyJobs();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleDelete = async (jobId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this job listing?"
    );

    if (!confirmDelete) return;

    try {
      await deleteJob(jobId);
      setJobs(jobs.filter((job) => job._id !== jobId));
    } catch (error) {
      console.error("Failed to delete job:", error);
      alert("Could not delete job. Please try again.");
    }
  };

  const sortedJobs = [...jobs].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (sortBy === "highest") {
      return b.budget - a.budget;
    }
    if (sortBy === "lowest") {
      return a.budget - b.budget;
    }
    return 0;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans transition-colors">
      <Navbar />

      <div className="flex-1 max-w-6xl mx-auto p-6 py-10 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold">My Posted Jobs</h1>

          <div className="flex gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-3 py-2 outline-none cursor-pointer"
            >
              <option value="newest" className="bg-slate-900 text-white">Newest</option>
              <option value="highest" className="bg-slate-900 text-white">Highest Budget</option>
              <option value="lowest" className="bg-slate-900 text-white">Lowest Budget</option>
            </select>

            <Link
              to="/create-job"
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition"
            >
              + Post a New Job
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-[var(--text-secondary)] font-medium text-lg">
              Loading your jobs...
            </p>
          </div>
        ) : sortedJobs.length === 0 ? (
          <div className="text-center py-12 bg-[var(--bg-secondary)] rounded-xl border border-dashed border-[var(--border-color)]">
            <p className="text-[var(--text-secondary)]">
              You haven't posted any jobs yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {sortedJobs.map((job) => (
              <div
                key={job._id}
                className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:justify-between gap-6">
                  {/* Job Info */}
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                      {job.title}
                    </h2>

                    <p className="text-[var(--text-secondary)] mb-4">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap gap-3 mb-4">
                      <span className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-md text-sm font-medium">
                        Budget: KES {job.budget?.toLocaleString()}
                      </span>

                      <span className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-md text-sm font-medium">
                        Posted: {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {job.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map((skill) => (
                          <span
                            key={skill}
                            className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-start gap-2">
                    <Link
                      to={`/job-applicants/${job._id}`}
                      className="text-cyan-400 hover:bg-cyan-500/10 border border-cyan-500/30 px-3 py-2 rounded-lg text-sm font-medium transition"
                    >
                      View Applicants
                    </Link>

                    <button
                      onClick={() => navigate(`/edit-job/${job._id}`)}
                      className="text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] border border-[var(--border-color)] px-3 py-2 rounded-lg text-sm font-medium transition"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(job._id)}
                      className="text-red-400 hover:bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg text-sm font-medium transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default MyJobs;
