import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../../components/Footer";
import { useLanguage } from "../../context/LanguageContext";
import { deleteJob, getMyJobs } from "../../services/job.service";
import { payPlatformFee } from "../../services/platformPayment.service";
import api from "../../services/api";

const MyJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [deletingId, setDeletingId] = useState(null);
  const [payingJobId, setPayingJobId] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");

  const { t } = useLanguage();

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const data = await getMyJobs();

      setJobs(data.jobs || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);

      setErrorMsg(
        error.response?.data?.message ||
          "Unable to load your jobs. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleDelete = async (jobId) => {
    const confirmDelete = window.confirm(
      t("confirmDelete") ||
        "Are you sure you want to delete this job listing?"
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(jobId);

      await deleteJob(jobId);

      setJobs((previousJobs) =>
        previousJobs.filter((job) => job._id !== jobId)
      );
    } catch (error) {
      console.error("Failed to delete job:", error);

      alert(
        error.response?.data?.message ||
          t("deleteError") ||
          "Could not delete job. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const sortedJobs = [...jobs].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }

    if (sortBy === "highest") {
      return (b.budget || 0) - (a.budget || 0);
    }

    if (sortBy === "lowest") {
      return (a.budget || 0) - (b.budget || 0);
    }

    return 0;
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case "Open":
        return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";

      case "In Progress":
        return "bg-blue-500/15 text-blue-400 border border-blue-500/30";

      case "Completed":
        return "bg-purple-500/15 text-purple-400 border border-purple-500/30";

      case "Cancelled":
        return "bg-red-500/15 text-red-400 border border-red-500/30";

      default:
        return "bg-slate-500/15 text-slate-400 border border-slate-500/30";
    }
  };

  const handlePlatformPayment = async (job) => {
  if (!phoneNumber.trim()) {
    alert("Please enter your M-Pesa phone number.");
    return;
  }

  try {
    setPayingJobId(job._id);

    const { data } = await api.post(
      `/platform-payments/${job._id}/pay`,
      {
        phoneNumber: phoneNumber.trim(),
      }
    );

    if (data.success) {
      alert(
        "M-Pesa payment request sent. Check your phone and enter your M-Pesa PIN."
      );

      setPhoneNumber("");
    }
  } catch (error) {
    console.error("Platform payment error:", error);

    alert(
      error.response?.data?.message ||
        "Unable to initiate platform fee payment."
    );
  } finally {
    setPayingJobId(null);
  }
    };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <main className="flex-1 max-w-7xl mx-auto p-6 py-10 w-full">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-5 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {t("myPostedJobs") || "My Posted Jobs"}
            </h1>

            <p className="text-[var(--text-secondary)]">
              Manage your job listings and track developer applications.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-3 outline-none cursor-pointer"
            >
              <option value="newest">
                {t("newest") || "Newest"}
              </option>

              <option value="highest">
                {t("highestBudget") || "Highest Budget"}
              </option>

              <option value="lowest">
                {t("lowestBudget") || "Lowest Budget"}
              </option>
            </select>

            <Link
              to="/create-job"
              className="bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-semibold py-3 px-5 rounded-lg shadow-md transition text-center"
            >
              + {t("postNewJob") || "Post New Job"}
            </Link>
          </div>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p>{errorMsg}</p>

              <button
                onClick={fetchJobs}
                className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />

              <p className="text-[var(--text-secondary)] font-medium">
                {t("loadingYourJobs") || "Loading your jobs..."}
              </p>
            </div>
          </div>
        ) : sortedJobs.length === 0 ? (
          /* Empty state */
          <div className="text-center py-16 px-6 bg-[var(--bg-secondary)] rounded-2xl border border-dashed border-[var(--border-color)]">
            <div className="text-5xl mb-4">💼</div>

            <h2 className="text-xl font-semibold mb-2">
              {t("noJobsPosted") || "You haven't posted any jobs yet."}
            </h2>

            <p className="text-[var(--text-secondary)] mb-6">
              Create your first job listing and start receiving applications
              from developers.
            </p>

            <Link
              to="/create-job"
              className="inline-block bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              + {t("postNewJob") || "Post New Job"}
            </Link>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-5">
                <p className="text-sm text-[var(--text-secondary)]">
                  Total Jobs
                </p>

                <p className="text-3xl font-bold mt-1">
                  {jobs.length}
                </p>
              </div>

              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-5">
                <p className="text-sm text-[var(--text-secondary)]">
                  Published
                </p>

                <p className="text-3xl font-bold mt-1 text-emerald-400">
                  {jobs.filter((job) => job.isPublished).length}
                </p>
              </div>

              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-5">
                <p className="text-sm text-[var(--text-secondary)]">
                  Open
                </p>

                <p className="text-3xl font-bold mt-1 text-cyan-400">
                  {jobs.filter((job) => job.status === "Open").length}
                </p>
              </div>
            </div>

            {/* Jobs */}
            <div className="grid gap-6">
              {sortedJobs.map((job) => (
                <div
                  key={job._id}
                  className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm hover:shadow-lg transition"
                >
                  <div className="flex flex-col xl:flex-row xl:justify-between gap-6">
                    {/* Job information */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h2 className="text-xl md:text-2xl font-semibold">
                          {job.title}
                        </h2>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
                            job.status
                          )}`}
                        >
                          {job.status || "Open"}
                        </span>

                        {!job.isPublished && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
                            Unpublished
                          </span>
                        )}
                      </div>

                      <p className="text-[var(--text-secondary)] mb-5 leading-relaxed line-clamp-3">
                        {job.description}
                      </p>

                      {/* Job metadata */}
                      <div className="flex flex-wrap gap-3 mb-5">
                        <span className="bg-cyan-500/15 text-cyan-400 px-3 py-1.5 rounded-lg text-sm font-medium">
                          Budget: KES{" "}
                          {Number(job.budget || 0).toLocaleString()}
                        </span>

                        {job.category?.name && (
                          <span className="bg-indigo-500/15 text-indigo-400 px-3 py-1.5 rounded-lg text-sm font-medium">
                            {job.category.name}
                          </span>
                        )}

                        {job.projectType && (
                          <span className="bg-purple-500/15 text-purple-400 px-3 py-1.5 rounded-lg text-sm font-medium">
                            {job.projectType}
                          </span>
                        )}

                        {job.workMode && (
                          <span className="bg-blue-500/15 text-blue-400 px-3 py-1.5 rounded-lg text-sm font-medium">
                            {job.workMode}
                          </span>
                        )}

                        {job.experienceLevel && (
                          <span className="bg-orange-500/15 text-orange-400 px-3 py-1.5 rounded-lg text-sm font-medium">
                            {job.experienceLevel}
                          </span>
                        )}
                      </div>

                      {/* Skills */}
                      {Array.isArray(job.skills) && job.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-5">
                          {job.skills.map((skill, index) => (
                            <span
                              key={`${skill}-${index}`}
                              className="bg-emerald-500/15 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-[var(--text-secondary)]">
                        Posted{" "}
                        {job.createdAt
                          ? new Date(job.createdAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap xl:flex-col items-start gap-2 xl:min-w-[150px]">
                      <Link
                        to={`/jobs/${job._id}`}
                        className="w-full text-center text-cyan-400 hover:bg-cyan-500/10 border border-cyan-500/30 px-4 py-2.5 rounded-lg text-sm font-medium transition"
                      >
                        View Job
                      </Link>
                      {!job.isPublished && !job.platformFeePaid && (
  <div className="w-full mt-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
    <p className="text-xs text-yellow-400 mb-2">
      Platform fee required before publishing.
    </p>

    <p className="text-sm font-semibold mb-2">
      Fee: KES{" "}
      {Number(job.platformFee || 0).toLocaleString()}
    </p>

    <input
      type="tel"
      placeholder="M-Pesa number"
      value={phoneNumber}
      onChange={(e) => setPhoneNumber(e.target.value)}
      className="w-full px-3 py-2 mb-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm outline-none"
    />

    <button
      onClick={() => handlePlatformPayment(job)}
      disabled={payingJobId === job._id}
      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {payingJobId === job._id
        ? "Sending..."
        : "Pay & Publish"}
    </button>
  </div>
)}

                      <Link
                        to={`/job-applicants/${job._id}`}
                        className="w-full text-center text-indigo-400 hover:bg-indigo-500/10 border border-indigo-500/30 px-4 py-2.5 rounded-lg text-sm font-medium transition"
                      >
                        {t("viewApplicants") || "View Applicants"}
                      </Link>

                      <Link
                        to={`/edit-job/${job._id}`}
                        className="w-full text-center text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] border border-[var(--border-color)] px-4 py-2.5 rounded-lg text-sm font-medium transition"
                      >
                        {t("edit") || "Edit"}
                      </Link>

                      <button
                        onClick={() => handleDelete(job._id)}
                        disabled={deletingId === job._id}
                        className="w-full text-center text-red-400 hover:bg-red-500/10 border border-red-500/30 px-4 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === job._id
                          ? "Deleting..."
                          : t("delete") || "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MyJobs;