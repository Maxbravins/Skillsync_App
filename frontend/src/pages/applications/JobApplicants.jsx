import {
  CheckCircle,
  FileText,
  Mail,
  User,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import Navbar from "../../components/Navbar";

import {
  getJobApplications,
  updateApplicationStatus,
} from "../../services/application.service";

import { initiatePayment } from "../../services/mpesa.service";

const JobApplicants = () => {
  const { jobId } = useParams();

  // ============================================================
  // STATE
  // ============================================================

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [paymentModal, setPaymentModal] = useState({
    open: false,
    applicationId: null,
  });

  const [paymentPhoneNumber, setPaymentPhoneNumber] =
    useState("");

  const [paymentLoading, setPaymentLoading] =
    useState(false);

  // ============================================================
  // FETCH APPLICATIONS
  // ============================================================

  const fetchApplications = useCallback(async () => {
    if (!jobId) {
      setError("Job ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await getJobApplications(jobId);

      setApplications(
        Array.isArray(data?.applications)
          ? data.applications
          : []
      );
    } catch (error) {
      console.error(
        "Failed to fetch job applications:",
        error
      );

      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load applications. Please try again."
      );

      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // ============================================================
  // APPLICATION COUNTS
  // ============================================================

  const applicationCounts = useMemo(() => {
    return applications.reduce(
      (counts, application) => {
        const status = application?.status;

        if (status === "pending") {
          counts.pending += 1;
        }

        if (status === "reviewed") {
          counts.reviewed += 1;
        }

        if (status === "shortlisted") {
          counts.shortlisted += 1;
        }

        if (status === "accepted") {
          counts.accepted += 1;
        }

        if (status === "rejected") {
          counts.rejected += 1;
        }

        if (status === "withdrawn") {
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

  // ============================================================
  // FILTER APPLICATIONS
  // ============================================================

  const filteredApplications = useMemo(() => {
    if (statusFilter === "all") {
      return applications;
    }

    return applications.filter(
      (application) =>
        application.status === statusFilter
    );
  }, [applications, statusFilter]);

  // ============================================================
  // UPDATE APPLICATION STATUS
  // ============================================================

  const handleStatus = async (
    applicationId,
    status
  ) => {
    if (!applicationId || processingId) {
      return;
    }

    try {
      setProcessingId(applicationId);
      setError("");

      await updateApplicationStatus(
        applicationId,
        status
      );

      /*
       * Important:
       *
       * When an application is accepted, the backend service
       * automatically rejects the other active applications
       * for the same job.
       *
       * Therefore we refresh the complete list here.
       */
      await fetchApplications();
    } catch (error) {
      console.error(
        "Failed to update application status:",
        error
      );

      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update application status. Please try again."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // ============================================================
  // PAYMENT
  // ============================================================

  const openPaymentModal = (applicationId) => {
    setPaymentModal({
      open: true,
      applicationId,
    });

    setPaymentPhoneNumber("");
    setError("");
  };

  const closePaymentModal = () => {
    if (paymentLoading) {
      return;
    }

    setPaymentModal({
      open: false,
      applicationId: null,
    });

    setPaymentPhoneNumber("");
  };

  const handlePayment = async (event) => {
    event.preventDefault();

    const applicationId =
      paymentModal.applicationId;

    const phoneNumber =
      paymentPhoneNumber.trim();

    if (!applicationId) {
      setError("Application information is missing.");
      return;
    }

    if (!phoneNumber) {
      setError(
        "Please enter the developer's M-Pesa phone number."
      );
      return;
    }

    try {
      setPaymentLoading(true);
      setError("");

      const response =
        await initiatePayment(
          applicationId,
          phoneNumber
        );

      alert(
        response?.message ||
          "Payment request initiated successfully."
      );

      closePaymentModal();

      await fetchApplications();
    } catch (error) {
      console.error(
        "Payment failed:",
        error
      );

      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Payment failed. Please try again."
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  // ============================================================
  // STATUS STYLES
  // ============================================================

  const getStatusClasses = (status) => {
    const classes = {
      pending:
        "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",

      reviewed:
        "bg-blue-500/20 text-blue-400 border-blue-500/30",

      shortlisted:
        "bg-purple-500/20 text-purple-400 border-purple-500/30",

      accepted:
        "bg-green-500/20 text-green-400 border-green-500/30",

      rejected:
        "bg-red-500/20 text-red-400 border-red-500/30",

      withdrawn:
        "bg-slate-500/20 text-slate-400 border-slate-500/30",
    };

    return (
      classes[status] ||
      "bg-slate-500/20 text-slate-400 border-slate-500/30"
    );
  };

  // ============================================================
  // EMPTY STATE TEXT
  // ============================================================

  const getEmptyStateTitle = () => {
    const titles = {
      all: "No applications yet",
      pending: "No pending applications",
      reviewed: "No reviewed applications",
      shortlisted: "No shortlisted applications",
      accepted: "No accepted applications",
      rejected: "No rejected applications",
      withdrawn: "No withdrawn applications",
    };

    return (
      titles[statusFilter] ||
      titles.all
    );
  };

  const getEmptyStateDescription = () => {
    const descriptions = {
      all:
        "No developers have applied for this job yet.",

      pending:
        "There are currently no developers waiting for your review.",

      reviewed:
        "There are currently no reviewed applications.",

      shortlisted:
        "There are currently no shortlisted developers.",

      accepted:
        "No developer has been accepted for this job yet.",

      rejected:
        "There are currently no rejected applications.",

      withdrawn:
        "There are currently no withdrawn applications.",
    };

    return (
      descriptions[statusFilter] ||
      descriptions.all
    );
  };

  // ============================================================
  // LOADING STATE
  // ============================================================

  if (loading) {
    return (
      <>
        <Navbar />

        <div className="min-h-screen bg-[var(--bg-primary)] flex justify-center items-center text-[var(--text-primary)]">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-4 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />

            <p className="text-xl">
              Loading applicants...
            </p>
          </div>
        </div>
      </>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

          {/* ====================================================
              HEADER
          ==================================================== */}

          <div className="mb-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold">
                  Job Applicants
                </h1>

                <p className="text-[var(--text-secondary)] mt-2">
                  Review and manage developers who applied
                  for this job.
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

          {/* ====================================================
              ERROR
          ==================================================== */}

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

          {/* ====================================================
              FILTERS
          ==================================================== */}

          <div className="flex flex-wrap gap-3 mb-8">
            {[
              {
                key: "all",
                label: "All",
                count: applications.length,
              },
              {
                key: "pending",
                label: "Pending",
                count:
                  applicationCounts.pending,
              },
              {
                key: "reviewed",
                label: "Reviewed",
                count:
                  applicationCounts.reviewed,
              },
              {
                key: "shortlisted",
                label: "Shortlisted",
                count:
                  applicationCounts.shortlisted,
              },
              {
                key: "accepted",
                label: "Accepted",
                count:
                  applicationCounts.accepted,
              },
              {
                key: "rejected",
                label: "Rejected",
                count:
                  applicationCounts.rejected,
              },
              {
                key: "withdrawn",
                label: "Withdrawn",
                count:
                  applicationCounts.withdrawn,
              },
            ].map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() =>
                  setStatusFilter(filter.key)
                }
                className={`px-5 py-2.5 rounded-xl font-semibold border transition ${
                  statusFilter === filter.key
                    ? "bg-cyan-600 border-cyan-500 text-white"
                    : "bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-cyan-500 hover:text-cyan-400"
                }`}
              >
                {filter.label}

                <span className="ml-2 opacity-80">
                  {filter.count}
                </span>
              </button>
            ))}
          </div>

          {/* ====================================================
              APPLICATIONS
          ==================================================== */}

          {filteredApplications.length === 0 ? (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                <FileText className="w-8 h-8 text-cyan-400" />
              </div>

              <h2 className="text-2xl font-bold mb-3">
                {getEmptyStateTitle()}
              </h2>

              <p className="text-[var(--text-secondary)]">
                {getEmptyStateDescription()}
              </p>

              {statusFilter !== "all" && (
                <button
                  type="button"
                  onClick={() =>
                    setStatusFilter("all")
                  }
                  className="inline-flex mt-6 bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2.5 rounded-lg font-semibold transition"
                >
                  View all applications
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredApplications.map(
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
                      key={application._id}
                      className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-5 sm:p-6 hover:border-cyan-500/50 transition"
                    >
                      {/* Developer */}
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
                            <User className="w-6 h-6 text-cyan-400" />
                          </div>

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

                            {developer?.skills &&
                              Array.isArray(
                                developer.skills
                              ) &&
                              developer.skills.length >
                                0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {developer.skills
                                    .slice(0, 6)
                                    .map(
                                      (
                                        skill,
                                        index
                                      ) => (
                                        <span
                                          key={`${skill}-${index}`}
                                          className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-full"
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
                          className={`self-start px-4 py-1.5 rounded-full border text-sm font-semibold capitalize ${getStatusClasses(
                            application.status
                          )}`}
                        >
                          {application.status ||
                            "unknown"}
                        </span>
                      </div>

                      {/* Job Information */}
                      <div className="mt-6 pt-5 border-t border-[var(--border-color)]">
                        <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                          Applied for
                        </p>

                        <h3 className="text-lg font-bold mt-1">
                          {job?.title ||
                            "Unknown Job"}
                        </h3>

                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-[var(--text-secondary)]">
                          {application.proposedBudget !==
                            undefined &&
                            application.proposedBudget !==
                              null && (
                              <span>
                                Proposed budget:{" "}
                                <strong className="text-[var(--text-primary)]">
                                  {application.proposedBudget}{" "}
                                  {job?.currency ||
                                    ""}
                                </strong>
                              </span>
                            )}

                          {application.proposedTimeline && (
                            <span>
                              Timeline:{" "}
                              <strong className="text-[var(--text-primary)]">
                                {
                                  application.proposedTimeline
                                }
                              </strong>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Cover Letter */}
                      <div className="mt-6">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-5 h-5 text-cyan-400" />

                          <h3 className="font-semibold">
                            Cover Letter
                          </h3>
                        </div>

                        <div className="text-[var(--text-primary)] leading-7 whitespace-pre-wrap bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-4">
                          {application.coverLetter ||
                            "No cover letter provided."}
                        </div>
                      </div>

                      {/* Attachments */}
                      {Array.isArray(
                        application.attachments
                      ) &&
                        application.attachments
                          .length > 0 && (
                          <div className="mt-6">
                            <h3 className="font-semibold mb-3">
                              Attachments
                            </h3>

                            <div className="space-y-2">
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
                                      ? `Attachment ${
                                          index + 1
                                        }`
                                      : attachment?.name ||
                                        `Attachment ${
                                          index + 1
                                        }`;

                                  if (!url) {
                                    return null;
                                  }

                                  return (
                                    <a
                                      key={`${url}-${index}`}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block text-cyan-400 hover:text-cyan-300 underline break-all"
                                    >
                                      {name}
                                    </a>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        )}

                      {/* Accept / Reject / Review */}
                      {[
                        "pending",
                        "reviewed",
                        "shortlisted",
                      ].includes(
                        application.status
                      ) && (
                        <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-5 border-t border-[var(--border-color)]">
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
                            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg transition font-medium"
                          >
                            <CheckCircle
                              size={18}
                            />

                            {isProcessing
                              ? "Processing..."
                              : "Accept"}
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
                            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg transition font-medium"
                          >
                            <XCircle
                              size={18}
                            />

                            {isProcessing
                              ? "Processing..."
                              : "Reject"}
                          </button>
                        </div>
                      )}

                      {/* Payment */}
                      {application.status ===
                        "accepted" &&
                        application.paymentStatus !==
                          "paid" && (
                          <div className="mt-6 pt-5 border-t border-[var(--border-color)]">
                            {application.paymentStatus ===
                            "pending" ? (
                              <div className="text-yellow-400 font-semibold">
                                Payment Pending Approval
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  openPaymentModal(
                                    application._id
                                  )
                                }
                                className="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2.5 rounded-lg transition font-medium"
                              >
                                Pay Developer
                              </button>
                            )}
                          </div>
                        )}

                      {application.paymentStatus ===
                        "paid" && (
                        <div className="mt-6 pt-5 border-t border-[var(--border-color)] text-green-400 font-semibold">
                          Developer Paid
                        </div>
                      )}
                    </article>
                  );
                }
              )}
            </div>
          )}

          {/* ====================================================
              PAYMENT MODAL
          ==================================================== */}

          {paymentModal.open && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 w-full max-w-md shadow-2xl">
                <h2 className="text-xl font-semibold mb-2">
                  Pay Developer
                </h2>

                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Enter the developer's M-Pesa phone
                  number to initiate the payment.
                </p>

                <form
                  onSubmit={handlePayment}
                  className="space-y-4"
                >
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={
                      paymentPhoneNumber
                    }
                    onChange={(event) =>
                      setPaymentPhoneNumber(
                        event.target.value
                      )
                    }
                    placeholder="0712345678"
                    className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-[var(--text-primary)] outline-none focus:border-cyan-500"
                    required
                    disabled={
                      paymentLoading
                    }
                  />

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="submit"
                      disabled={
                        paymentLoading ||
                        !paymentPhoneNumber.trim()
                      }
                      className="flex-1 rounded-lg bg-cyan-600 px-4 py-2.5 font-semibold hover:bg-cyan-700 disabled:opacity-60 disabled:cursor-not-allowed text-white"
                    >
                      {paymentLoading
                        ? "Processing..."
                        : "Send M-Pesa Payment"}
                    </button>

                    <button
                      type="button"
                      onClick={
                        closePaymentModal
                      }
                      disabled={
                        paymentLoading
                      }
                      className="flex-1 rounded-lg border border-[var(--border-color)] px-4 py-2.5 font-semibold hover:bg-[var(--bg-primary)] disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default JobApplicants;
