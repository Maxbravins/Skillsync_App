import {
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Mail,
  Paperclip,
  User,
  XCircle,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useSearchParams,
} from "react-router-dom";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

import {
  getClientApplications,
  acceptApplication,
  rejectApplication,
  reviewApplication,
  shortlistApplication,
} from "../../services/application.service";

const ClientApplications = () => {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const filter =
    searchParams.get("status") || "all";

  const jobId =
    searchParams.get("jobId") || null;

  const [applications, setApplications] =
    useState([]);

  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: 20,
      total: 0,
      pages: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [processingId, setProcessingId] =
    useState(null);

  const [error, setError] =
    useState("");

  const fetchApplications =
    useCallback(
      async (page = 1) => {
        try {
          setLoading(true);
          setError("");

          const params = {
            page,
            limit: 20,
          };

          if (filter !== "all") {
            params.status = filter;
          }

          if (jobId) {
            params.jobId = jobId;
          }

          const data =
            await getClientApplications(
              params
            );

          setApplications(
            Array.isArray(
              data?.applications
            )
              ? data.applications
              : []
          );

          setPagination(
            data?.pagination || {
              page,
              limit: 20,
              total: 0,
              pages: 0,
            }
          );
        } catch (error) {
          console.error(
            "Failed to fetch client applications:",
            error
          );

          setError(
            error?.response?.data
              ?.message ||
              error?.message ||
              "Failed to load applications. Please try again."
          );
        } finally {
          setLoading(false);
        }
      },
      [filter, jobId]
    );

  useEffect(() => {
    fetchApplications(1);
  }, [fetchApplications]);

  const applicationCounts =
    useMemo(() => {
      return applications.reduce(
        (counts, application) => {
          const status =
            application.status;

          if (
            status === "pending"
          ) {
            counts.pending += 1;
          }

          if (
            status === "reviewed"
          ) {
            counts.reviewed += 1;
          }

          if (
            status === "shortlisted"
          ) {
            counts.shortlisted += 1;
          }

          if (
            status === "accepted"
          ) {
            counts.accepted += 1;
          }

          if (
            status === "rejected"
          ) {
            counts.rejected += 1;
          }

          if (
            status === "withdrawn"
          ) {
            counts.withdrawn += 1;
          }

          return counts;
        },
        {
          pending: 0,
          reviewed: 0,
          shortlisted: 0,
          accepted: 0,
          rejected: 0,
          withdrawn: 0,
        }
      );
    }, [applications]);

  const pageTitle =
    useMemo(() => {
      const titles = {
        all: "All Applications",
        pending:
          "Pending Applications",
        reviewed:
          "Reviewed Applications",
        shortlisted:
          "Shortlisted Applications",
        accepted:
          "Accepted Applications",
        rejected:
          "Rejected Applications",
        withdrawn:
          "Withdrawn Applications",
      };

      return (
        titles[filter] ||
        titles.all
      );
    }, [filter]);

  const handleStatus = async (
    applicationId,
    action
  ) => {
    if (
      !applicationId ||
      processingId
    ) {
      return;
    }

    try {
      setProcessingId(
        applicationId
      );
      setError("");

      switch (action) {
        case "reviewed":
          await reviewApplication(
            applicationId
          );
          break;

        case "shortlisted":
          await shortlistApplication(
            applicationId
          );
          break;

        case "accepted":
          await acceptApplication(
            applicationId
          );
          break;

        case "rejected":
          await rejectApplication(
            applicationId
          );
          break;

        default:
          throw new Error(
            `Unsupported application action: ${action}`
          );
      }

      await fetchApplications(
        pagination.page
      );
    } catch (error) {
      console.error(
        "Failed to update application:",
        error
      );

      setError(
        error?.response?.data
          ?.message ||
          error?.message ||
          "Failed to update application. Please try again."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const changeFilter = (
    status
  ) => {
    const params = {};

    if (status !== "all") {
      params.status = status;
    }

    if (jobId) {
      params.jobId = jobId;
    }

    setSearchParams(params);
  };

  const changePage = (
    page
  ) => {
    if (
      page < 1 ||
      page > pagination.pages ||
      page === pagination.page
    ) {
      return;
    }

    fetchApplications(page);
  };

  const getStatusClasses = (
    status
  ) => {
    const classes = {
      pending:
        "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",

      reviewed:
        "bg-blue-500/15 text-blue-400 border-blue-500/20",

      shortlisted:
        "bg-purple-500/15 text-purple-400 border-purple-500/20",

      accepted:
        "bg-green-500/15 text-green-400 border-green-500/20",

      rejected:
        "bg-red-500/15 text-red-400 border-red-500/20",

      withdrawn:
        "bg-slate-500/15 text-slate-400 border-slate-500/20",
    };

    return (
      classes[status] ||
      "bg-slate-500/15 text-slate-400 border-slate-500/20"
    );
  };

  const formatDate = (
    value
  ) => {
    if (!value) {
      return "—";
    }

    const date = new Date(
      value
    );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "—";
    }

    return date.toLocaleDateString(
      undefined,
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  const formatAmount = (
    application
  ) => {
    if (
      application?.proposedAmount ===
      undefined ||
      application?.proposedAmount ===
      null
    ) {
      return "Not provided";
    }

    const amount =
      Number(
        application.proposedAmount
      );

    if (
      !Number.isFinite(amount)
    ) {
      return "Not provided";
    }

    const currency =
      application?.job
        ?.currency || "";

    return `${currency ? `${currency} ` : ""}${amount.toLocaleString()}`;
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
                Client Applications
              </p>

              <h1 className="text-3xl sm:text-4xl font-bold">
                {pageTitle}
              </h1>

              <p className="mt-2 text-[var(--text-secondary)]">
                Review and manage developers who have applied to your jobs.
              </p>
            </div>

            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-5 py-3">
              <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">
                Applications
              </p>

              <p className="text-2xl font-bold text-cyan-400 mt-1">
                {pagination.total}
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
              onClick={() =>
                fetchApplications(
                  pagination.page
                )
              }
              className="shrink-0 bg-red-500/20 hover:bg-red-500/30 px-4 py-2 rounded-lg font-medium transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            type="button"
            onClick={() =>
              changeFilter("all")
            }
            className={`px-4 py-2 rounded-lg font-medium transition border ${
              filter === "all"
                ? "bg-cyan-600 border-cyan-600 text-white"
                : "bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-cyan-500/50"
            }`}
          >
            All ({filter === "all"
              ? pagination.total
              : "—"})
          </button>

          <button
            type="button"
            onClick={() =>
              changeFilter("pending")
            }
            className={`px-4 py-2 rounded-lg font-medium transition border ${
              filter === "pending"
                ? "bg-yellow-600 border-yellow-600 text-white"
                : "bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-yellow-500/50"
            }`}
          >
            Pending ({applicationCounts.pending})
          </button>

          <button
            type="button"
            onClick={() =>
              changeFilter("reviewed")
            }
            className={`px-4 py-2 rounded-lg font-medium transition border ${
              filter === "reviewed"
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-blue-500/50"
            }`}
          >
            Reviewed ({applicationCounts.reviewed})
          </button>

          <button
            type="button"
            onClick={() =>
              changeFilter(
                "shortlisted"
              )
            }
            className={`px-4 py-2 rounded-lg font-medium transition border ${
              filter ===
              "shortlisted"
                ? "bg-purple-600 border-purple-600 text-white"
                : "bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-purple-500/50"
            }`}
          >
            Shortlisted (
            {applicationCounts.shortlisted}
            )
          </button>

          <button
            type="button"
            onClick={() =>
              changeFilter("accepted")
            }
            className={`px-4 py-2 rounded-lg font-medium transition border ${
              filter === "accepted"
                ? "bg-green-600 border-green-600 text-white"
                : "bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-green-500/50"
            }`}
          >
            Accepted ({applicationCounts.accepted})
          </button>

          <button
            type="button"
            onClick={() =>
              changeFilter("rejected")
            }
            className={`px-4 py-2 rounded-lg font-medium transition border ${
              filter === "rejected"
                ? "bg-red-600 border-red-600 text-white"
                : "bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-red-500/50"
            }`}
          >
            Rejected ({applicationCounts.rejected})
          </button>
        </div>

        {/* Empty State */}
        {applications.length ===
        0 ? (
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

            {filter !==
              "all" && (
              <button
                type="button"
                onClick={() =>
                  changeFilter("all")
                }
                className="inline-flex mt-6 bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2.5 rounded-lg font-semibold transition"
              >
                View all applications
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Applications */}
            <div className="space-y-6">
              {applications.map(
                (application) => {
                  const developer =
                    application.developer;

                  const job =
                    application.job;

                  const isProcessing =
                    processingId ===
                    application._id;

                  return (
                    <article
                      key={
                        application._id
                      }
                      className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 sm:p-6 hover:border-cyan-500/30 transition"
                    >
                      {/* Developer Header */}
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                        <div className="flex items-start gap-4">
                          {developer?.profileImage ? (
                            <img
                              src={
                                developer.profileImage
                              }
                              alt={
                                developer.username ||
                                "Developer"
                              }
                              className="w-12 h-12 rounded-xl object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
                              <User className="w-6 h-6 text-cyan-400" />
                            </div>
                          )}

                          <div>
                            <h2 className="text-xl font-bold">
                              {developer?.username ||
                                "Unknown Developer"}
                            </h2>

                            <div className="flex items-center gap-2 mt-2 text-sm text-[var(--text-secondary)]">
                              <Mail className="w-4 h-4 shrink-0" />

                              <span className="break-all">
                                {developer?.email ||
                                  "No email available"}
                              </span>
                            </div>

                            {Array.isArray(
                              developer?.skills
                            ) &&
                              developer
                                .skills
                                .length >
                                0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {developer.skills
                                    .slice(
                                      0,
                                      6
                                    )
                                    .map(
                                      (
                                        skill,
                                        index
                                      ) => (
                                        <span
                                          key={`${skill}-${index}`}
                                          className="px-2.5 py-1 rounded-full text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                        >
                                          {skill}
                                        </span>
                                      )
                                    )}
                                </div>
                              )}
                          </div>
                        </div>

                        <span
                          className={`self-start px-3 py-1.5 rounded-full border text-sm font-semibold capitalize ${getStatusClasses(
                            application.status
                          )}`}
                        >
                          {application.status ||
                            "unknown"}
                        </span>
                      </div>

                      {/* Job */}
                      <div className="mt-6 pt-5 border-t border-[var(--border-color)]">
                        <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                          Applied for
                        </p>

                        <h3 className="text-lg font-bold mt-1">
                          {job?.title ||
                            "Unknown Job"}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                          <div className="flex items-center gap-3">
                            <DollarSign className="w-5 h-5 text-cyan-400" />

                            <div>
                              <p className="text-xs text-[var(--text-secondary)]">
                                Proposed Amount
                              </p>

                              <p className="font-semibold">
                                {formatAmount(
                                  application
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-cyan-400" />

                            <div>
                              <p className="text-xs text-[var(--text-secondary)]">
                                Estimated Duration
                              </p>

                              <p className="font-semibold">
                                {application.estimatedDuration ||
                                  "Not provided"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-cyan-400" />

                            <div>
                              <p className="text-xs text-[var(--text-secondary)]">
                                Applied
                              </p>

                              <p className="font-semibold">
                                {formatDate(
                                  application.createdAt
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
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

                      {/* Attachments */}
                      {Array.isArray(
                        application.attachments
                      ) &&
                        application
                          .attachments
                          .length >
                          0 && (
                          <div className="mt-6">
                            <div className="flex items-center gap-2 mb-3">
                              <Paperclip className="w-5 h-5 text-cyan-400" />

                              <h3 className="font-semibold">
                                Attachments
                              </h3>
                            </div>

                            <div className="flex flex-wrap gap-3">
                              {application.attachments.map(
                                (
                                  attachment,
                                  index
                                ) => {
                                  const url =
                                    typeof attachment ===
                                    "string"
                                      ? attachment
                                      : attachment?.url;

                                  const name =
                                    typeof attachment ===
                                    "string"
                                      ? `Attachment ${index + 1}`
                                      : attachment?.name ||
                                        `Attachment ${index + 1}`;

                                  if (
                                    !url
                                  ) {
                                    return null;
                                  }

                                  return (
                                    <a
                                      key={`${url}-${index}`}
                                      href={
                                        url
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-cyan-500/50 text-sm transition"
                                    >
                                      <Paperclip className="w-4 h-4 text-cyan-400" />

                                      <span className="max-w-[220px] truncate">
                                        {
                                          name
                                        }
                                      </span>
                                    </a>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        )}

                      {/* Rejection reason */}
                      {application.status ===
                        "rejected" &&
                        application.rejectionReason && (
                          <div className="mt-6 bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                            <p className="text-sm font-semibold text-red-400 mb-1">
                              Rejection reason
                            </p>

                            <p className="text-sm text-[var(--text-secondary)]">
                              {
                                application.rejectionReason
                              }
                            </p>
                          </div>
                        )}

                      {/* Application Dates */}
                      {(application.reviewedAt ||
                        application.acceptedAt ||
                        application.rejectedAt ||
                        application.withdrawnAt) && (
                        <div className="mt-6 pt-5 border-t border-[var(--border-color)]">
                          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--text-secondary)]">
                            {application.reviewedAt && (
                              <span>
                                Reviewed:{" "}
                                <strong className="text-[var(--text-primary)]">
                                  {formatDate(
                                    application.reviewedAt
                                  )}
                                </strong>
                              </span>
                            )}

                            {application.acceptedAt && (
                              <span>
                                Accepted:{" "}
                                <strong className="text-green-400">
                                  {formatDate(
                                    application.acceptedAt
                                  )}
                                </strong>
                              </span>
                            )}

                            {application.rejectedAt && (
                              <span>
                                Rejected:{" "}
                                <strong className="text-red-400">
                                  {formatDate(
                                    application.rejectedAt
                                  )}
                                </strong>
                              </span>
                            )}

                            {application.withdrawnAt && (
                              <span>
                                Withdrawn:{" "}
                                <strong>
                                  {formatDate(
                                    application.withdrawnAt
                                  )}
                                </strong>
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {[
                        "pending",
                        "reviewed",
                        "shortlisted",
                      ].includes(
                        application.status
                      ) && (
                        <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-6 pt-5 border-t border-[var(--border-color)]">
                          {[
                            "pending",
                            "reviewed",
                          ].includes(
                            application.status
                          ) && (
                            <button
                              type="button"
                              disabled={
                                isProcessing
                              }
                              onClick={() =>
                                handleStatus(
                                  application._id,
                                  "shortlisted"
                                )
                              }
                              className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg transition font-semibold"
                            >
                              <CheckCircle
                                size={
                                  18
                                }
                              />

                              {isProcessing
                                ? "Processing..."
                                : "Shortlist"}
                            </button>
                          )}

                          {application.status ===
                            "pending" && (
                            <button
                              type="button"
                              disabled={
                                isProcessing
                              }
                              onClick={() =>
                                handleStatus(
                                  application._id,
                                  "reviewed"
                                )
                              }
                              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg transition font-semibold"
                            >
                              <FileText
                                size={
                                  18
                                }
                              />

                              {isProcessing
                                ? "Processing..."
                                : "Mark Reviewed"}
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={
                              isProcessing
                            }
                            onClick={() =>
                              handleStatus(
                                application._id,
                                "accepted"
                              )
                            }
                            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg transition font-semibold"
                          >
                            <CheckCircle
                              size={18}
                            />

                            {isProcessing
                              ? "Processing..."
                              : "Accept Application"}
                          </button>

                          <button
                            type="button"
                            disabled={
                              isProcessing
                            }
                            onClick={() =>
                              handleStatus(
                                application._id,
                                "rejected"
                              )
                            }
                            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg transition font-semibold"
                          >
                            <XCircle
                              size={18}
                            />

                            Reject Application
                          </button>
                        </div>
                      )}
                    </article>
                  );
                }
              )}
            </div>

            {/* Pagination */}
            {pagination.pages >
              1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
                <p className="text-sm text-[var(--text-secondary)]">
                  Page{" "}
                  <span className="font-semibold text-[var(--text-primary)]">
                    {pagination.page}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-[var(--text-primary)]">
                    {pagination.pages}
                  </span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      pagination.page <=
                        1 ||
                      loading
                    }
                    onClick={() =>
                      changePage(
                        pagination.page -
                          1
                      )
                    }
                    className="px-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-cyan-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={
                      pagination.page >=
                        pagination.pages ||
                      loading
                    }
                    onClick={() =>
                      changePage(
                        pagination.page +
                          1
                      )
                    }
                    className="px-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-cyan-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ClientApplications;
