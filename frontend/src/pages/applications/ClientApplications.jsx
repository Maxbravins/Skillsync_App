import {
  CheckCircle,
  FileText,
  Mail,
  User,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

import {
  getClientApplications,
  updateApplicationStatus,
} from "../../services/application.service";

const ClientApplications = () => {
  const [searchParams] = useSearchParams();

  const filter = searchParams.get("status") || "all";

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getClientApplications();

      setApplications(
        Array.isArray(data?.applications) ? data.applications : []
      );
    } catch (error) {
      console.error("Failed to fetch client applications:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load applications. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const applicationCounts = useMemo(() => {
    return applications.reduce(
      (counts, application) => {
        const status = application.status;

        if (status === "pending") counts.pending += 1;
        if (status === "accepted") counts.accepted += 1;
        if (status === "rejected") counts.rejected += 1;

        return counts;
      },
      {
        pending: 0,
        accepted: 0,
        rejected: 0,
      }
    );
  }, [applications]);

  const filteredApplications = useMemo(() => {
    if (filter === "all") {
      return applications;
    }

    return applications.filter(
      (application) => application.status === filter
    );
  }, [applications, filter]);

  const pageTitle = useMemo(() => {
    const titles = {
      all: "All Applications",
      pending: "Pending Applications",
      accepted: "Accepted Applications",
      rejected: "Rejected Applications",
    };

    return titles[filter] || titles.all;
  }, [filter]);

  const handleStatus = async (applicationId, status) => {
    if (!applicationId || processingId) {
      return;
    }

    try {
      setProcessingId(applicationId);
      setError("");

      await updateApplicationStatus(applicationId, status);

      await fetchApplications();
    } catch (error) {
      console.error("Failed to update application status:", error);

      setError(
        error.response?.data?.message ||
          "Failed to update application status. Please try again."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusClasses = (status) => {
    const classes = {
      pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
      accepted: "bg-green-500/15 text-green-400 border-green-500/20",
      rejected: "bg-red-500/15 text-red-400 border-red-500/20",
    };

    return (
      classes[status] ||
      "bg-slate-500/15 text-slate-400 border-slate-500/20"
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <Navbar />

        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-4 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />

            <p className="text-lg text-[var(--text-secondary)]">
              Loading applications...
            </p>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <p className="text-cyan-400 text-sm font-semibold uppercase tracking-wider mb-2">
                Developer Applications
              </p>

              <h1 className="text-3xl sm:text-4xl font-bold">
                {pageTitle}
              </h1>

              <p className="mt-2 text-[var(--text-secondary)]">
                Review developers who have applied to your jobs.
              </p>
            </div>

            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-5 py-3">
              <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">
                Total Applications
              </p>

              <p className="text-2xl font-bold text-cyan-400 mt-1">
                {applications.length}
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-4 rounded-xl">
            <p>{error}</p>

            <button
              type="button"
              onClick={fetchApplications}
              className="shrink-0 bg-red-500/20 hover:bg-red-500/30 px-4 py-2 rounded-lg font-medium transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Link
            to="/applications"
            className={`px-4 py-2 rounded-lg font-medium transition border ${
              filter === "all"
                ? "bg-cyan-600 border-cyan-600 text-white"
                : "bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-cyan-500/50"
            }`}
          >
            All ({applications.length})
          </Link>

          <Link
            to="/applications?status=pending"
            className={`px-4 py-2 rounded-lg font-medium transition border ${
              filter === "pending"
                ? "bg-yellow-600 border-yellow-600 text-white"
                : "bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-yellow-500/50"
            }`}
          >
            Pending ({applicationCounts.pending})
          </Link>

          <Link
            to="/applications?status=accepted"
            className={`px-4 py-2 rounded-lg font-medium transition border ${
              filter === "accepted"
                ? "bg-green-600 border-green-600 text-white"
                : "bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-green-500/50"
            }`}
          >
            Accepted ({applicationCounts.accepted})
          </Link>

          <Link
            to="/applications?status=rejected"
            className={`px-4 py-2 rounded-lg font-medium transition border ${
              filter === "rejected"
                ? "bg-red-600 border-red-600 text-white"
                : "bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-red-500/50"
            }`}
          >
            Rejected ({applicationCounts.rejected})
          </Link>
        </div>

        {/* Empty State */}
        {filteredApplications.length === 0 ? (
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-10 sm:p-14 text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
              <FileText className="w-8 h-8 text-cyan-400" />
            </div>

            <h2 className="text-2xl font-bold mb-3">
              No applications found
            </h2>

            <p className="max-w-md mx-auto text-[var(--text-secondary)]">
              {filter === "all"
                ? "Developers have not applied to your jobs yet."
                : `There are no ${filter} applications at the moment.`}
            </p>

            {filter !== "all" && (
              <Link
                to="/applications"
                className="inline-flex mt-6 bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2.5 rounded-lg font-semibold transition"
              >
                View all applications
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredApplications.map((application) => {
              const developer = application.developer;
              const job = application.job;
              const isProcessing = processingId === application._id;

              return (
                <article
                  key={application._id}
                  className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 sm:p-6 hover:border-cyan-500/30 transition"
                >
                  {/* Developer Header */}
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
                        <User className="w-6 h-6 text-cyan-400" />
                      </div>

                      <div>
                        <h2 className="text-xl font-bold">
                          {developer?.username || "Unknown Developer"}
                        </h2>

                        <div className="flex items-center gap-2 mt-2 text-sm text-[var(--text-secondary)]">
                          <Mail className="w-4 h-4 shrink-0" />

                          <span className="break-all">
                            {developer?.email || "No email available"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`self-start px-3 py-1.5 rounded-full border text-sm font-semibold capitalize ${getStatusClasses(
                        application.status
                      )}`}
                    >
                      {application.status || "unknown"}
                    </span>
                  </div>

                  {/* Job */}
                  <div className="mt-6 pt-5 border-t border-[var(--border-color)]">
                    <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                      Applied for
                    </p>

                    <h3 className="text-lg font-bold mt-1">
                      {job?.title || "Unknown Job"}
                    </h3>
                  </div>

                  {/* Cover Letter */}
                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-cyan-400" />

                      <h3 className="font-semibold">
                        Cover Letter
                      </h3>
                    </div>

                    <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4">
                      <p className="leading-7 whitespace-pre-wrap text-[var(--text-secondary)]">
                        {application.coverLetter ||
                          "No cover letter provided."}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {application.status === "pending" && (
                    <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-5 border-t border-[var(--border-color)]">
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() =>
                          handleStatus(application._id, "accepted")
                        }
                        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg transition font-semibold"
                      >
                        <CheckCircle size={18} />

                        {isProcessing
                          ? "Processing..."
                          : "Accept Application"}
                      </button>

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() =>
                          handleStatus(application._id, "rejected")
                        }
                        className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg transition font-semibold"
                      >
                        <XCircle size={18} />

                        Reject Application
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ClientApplications;
