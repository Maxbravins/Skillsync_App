import {
  Briefcase,
  CheckCircle,
  Clock3,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import useAuth from "../../hooks/useAuth";

import {
  getClientApplications,
  getMyApplications,
} from "../../services/application.service";

const MyApplications = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const statusFilter = searchParams.get("status") || "all";

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchApplications = useCallback(async () => {
    if (!user?.role) return;

    try {
      setLoading(true);
      setError("");

      const data =
        user.role === "client"
          ? await getClientApplications()
          : await getMyApplications();

      setApplications(
        Array.isArray(data?.applications) ? data.applications : []
      );
    } catch (error) {
      console.error("Failed to fetch applications:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load applications. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const applicationCounts = useMemo(() => {
    return applications.reduce(
      (counts, application) => {
        if (application.status === "pending") {
          counts.pending += 1;
        }

        if (application.status === "accepted") {
          counts.accepted += 1;
        }

        if (application.status === "rejected") {
          counts.rejected += 1;
        }

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
    if (statusFilter === "all") {
      return applications;
    }

    return applications.filter(
      (application) => application.status === statusFilter
    );
  }, [applications, statusFilter]);

  const pageTitle =
    user?.role === "client"
      ? "Applications Received"
      : "My Applications";

  const pageDescription =
    user?.role === "client"
      ? "Review developers who have applied to your jobs."
      : "Track every application you've submitted.";

  const getStatusClasses = (status) => {
    const classes = {
      pending:
        "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
      accepted:
        "bg-green-500/15 text-green-400 border-green-500/20",
      rejected:
        "bg-red-500/15 text-red-400 border-red-500/20",
    };

    return (
      classes[status] ||
      "bg-slate-500/15 text-slate-400 border-slate-500/20"
    );
  };

  const getStatusIcon = (status) => {
    if (status === "pending") {
      return <Clock3 size={18} />;
    }

    if (status === "accepted") {
      return <CheckCircle size={18} />;
    }

    if (status === "rejected") {
      return <XCircle size={18} />;
    }

    return null;
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
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans transition-colors">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
            <div>
              <p className="text-cyan-400 text-sm font-semibold uppercase tracking-wider mb-2">
                {user?.role === "client"
                  ? "Developer Applications"
                  : "Job Applications"}
              </p>

              <h1 className="text-3xl sm:text-4xl font-bold">
                {pageTitle}
              </h1>

              <p className="text-[var(--text-secondary)] mt-2">
                {pageDescription}
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
          <a
            href="/applications"
            className={`px-4 py-2 rounded-lg font-medium transition border ${
              statusFilter === "all"
                ? "bg-cyan-600 border-cyan-600 text-white"
                : "bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-cyan-500/50"
            }`}
          >
            All ({applications.length})
          </a>

          <a
            href="/applications?status=pending"
            className={`px-4 py-2 rounded-lg font-medium transition border ${
              statusFilter === "pending"
                ? "bg-yellow-600 border-yellow-600 text-white"
                : "bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-yellow-500/50"
            }`}
          >
            Pending ({applicationCounts.pending})
          </a>

          <a
            href="/applications?status=accepted"
            className={`px-4 py-2 rounded-lg font-medium transition border ${
              statusFilter === "accepted"
                ? "bg-green-600 border-green-600 text-white"
                : "bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-green-500/50"
            }`}
          >
            Accepted ({applicationCounts.accepted})
          </a>

          <a
            href="/applications?status=rejected"
            className={`px-4 py-2 rounded-lg font-medium transition border ${
              statusFilter === "rejected"
                ? "bg-red-600 border-red-600 text-white"
                : "bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-red-500/50"
            }`}
          >
            Rejected ({applicationCounts.rejected})
          </a>
        </div>

        {/* Empty State */}
        {filteredApplications.length === 0 ? (
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-10 sm:p-14 text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-cyan-400" />
            </div>

            <h2 className="text-2xl font-bold mb-3">
              No applications found
            </h2>

            <p className="max-w-md mx-auto text-[var(--text-secondary)]">
              {statusFilter === "all"
                ? user?.role === "client"
                  ? "Developers have not applied to your jobs yet."
                  : "You have not submitted any applications yet."
                : `There are no ${statusFilter} applications at the moment.`}
            </p>

            {statusFilter !== "all" && (
              <a
                href="/applications"
                className="inline-flex mt-6 bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2.5 rounded-lg font-semibold transition"
              >
                View all applications
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredApplications.map((application) => {
              const job = application.job;
              const developer = application.developer;

              return (
                <article
                  key={application._id}
                  className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 sm:p-6 hover:border-cyan-500/30 transition"
                >
                  {/* Application Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
                        <Briefcase
                          className="text-cyan-400"
                          size={24}
                        />
                      </div>

                      <div>
                        <h2 className="text-xl font-bold">
                          {job?.title || "Unknown Job"}
                        </h2>

                        {job?.budget !== undefined &&
                          job?.budget !== null && (
                            <p className="text-[var(--text-secondary)] mt-1">
                              Budget: KES {job.budget}
                            </p>
                          )}
                      </div>
                    </div>

                    <span
                      className={`self-start flex items-center gap-2 px-4 py-2 rounded-full border font-medium capitalize ${getStatusClasses(
                        application.status
                      )}`}
                    >
                      {getStatusIcon(application.status)}
                      {application.status || "Unknown"}
                    </span>
                  </div>

                  {/* Client / Developer */}
                  {user?.role === "developer" && application.client && (
                    <div className="mt-5 pt-5 border-t border-[var(--border-color)]">
                      <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                        Client
                      </p>

                      <p className="font-semibold mt-1">
                        {application.client?.username ||
                          application.client?.name ||
                          "Unknown Client"}
                      </p>
                    </div>
                  )}

                  {user?.role === "client" && developer && (
                    <div className="mt-5 pt-5 border-t border-[var(--border-color)]">
                      <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                        Developer
                      </p>

                      <p className="font-semibold mt-1">
                        {developer?.username || "Unknown Developer"}
                      </p>

                      {developer?.email && (
                        <p className="text-sm text-[var(--text-secondary)] mt-1">
                          {developer.email}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Cover Letter */}
                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText
                        className="text-cyan-400"
                        size={20}
                      />

                      <h3 className="font-semibold">
                        Cover Letter
                      </h3>
                    </div>

                    <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4">
                      <p className="text-[var(--text-primary)] leading-7 whitespace-pre-wrap">
                        {application.coverLetter ||
                          "No cover letter provided."}
                      </p>
                    </div>
                  </div>

                  {/* Payment Status */}
                  {user?.role === "developer" &&
                    application.status === "accepted" && (
                      <div className="mt-5 pt-5 border-t border-[var(--border-color)]">
                        <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                          Payment Status
                        </p>

                        <p
                          className={`mt-1 font-semibold ${
                            application.paymentStatus === "paid"
                              ? "text-green-400"
                              : application.paymentStatus ===
                                  "pending"
                                ? "text-yellow-400"
                                : "text-[var(--text-secondary)]"
                          }`}
                        >
                          {application.paymentStatus === "paid"
                            ? "Paid"
                            : application.paymentStatus === "pending"
                              ? "Payment Pending"
                              : "Not Paid"}
                        </p>
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

export default MyApplications;
