import {
  ArrowLeft,
  CheckCircle,
  Clock3,
  CreditCard,
  Mail,
  User,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import {
  getClientApplications,
  updateApplicationStatus,
} from "../../services/application.service";
import { initiatePayment } from "../../services/mpesa.service";

const JobApplicants = () => {
  const { jobId } = useParams();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [paymentModal, setPaymentModal] = useState({
    open: false,
    applicationId: null,
  });

  const [paymentPhoneNumber, setPaymentPhoneNumber] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getClientApplications();

      setApplications(data?.applications || []);
    } catch (error) {
      console.error("Failed to fetch applicants:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load applicants. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const jobApplications = useMemo(() => {
    if (!jobId) return [];

    return applications.filter(
      (application) => application.job?._id === jobId,
    );
  }, [applications, jobId]);

  const job = jobApplications[0]?.job;

  const handleStatus = async (applicationId, newStatus) => {
    try {
      setUpdatingId(applicationId);

      await updateApplicationStatus(applicationId, newStatus);

      setApplications((previous) =>
        previous.map((application) =>
          application._id === applicationId
            ? {
                ...application,
                status: newStatus,
              }
            : application,
        ),
      );
    } catch (error) {
      console.error("Failed to update application:", error);

      alert(
        error.response?.data?.message ||
          "Unable to update application status.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const openPaymentModal = (applicationId) => {
    setPaymentModal({
      open: true,
      applicationId,
    });

    setPaymentPhoneNumber("");
  };

  const closePaymentModal = () => {
    if (paymentLoading) return;

    setPaymentModal({
      open: false,
      applicationId: null,
    });

    setPaymentPhoneNumber("");
  };

  const handlePayment = async (event) => {
    event.preventDefault();

    const phoneNumber = paymentPhoneNumber.trim();

    if (!paymentModal.applicationId) {
      return;
    }

    if (!phoneNumber) {
      alert("Please enter the M-Pesa phone number.");
      return;
    }

    try {
      setPaymentLoading(true);

      const response = await initiatePayment(
        paymentModal.applicationId,
        phoneNumber,
      );

      alert(response?.message || "STK push sent successfully.");

      closePaymentModal();
      await fetchApplications();
    } catch (error) {
      console.error("Payment initiation failed:", error);

      alert(
        error.response?.data?.message ||
          "Payment initiation failed. Please try again.",
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === "accepted") {
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-green-500/15 px-3 py-1.5 text-sm font-semibold text-green-400 border border-green-500/20">
          <CheckCircle size={16} />
          Accepted
        </span>
      );
    }

    if (status === "rejected") {
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-red-500/15 px-3 py-1.5 text-sm font-semibold text-red-400 border border-red-500/20">
          <XCircle size={16} />
          Rejected
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-yellow-500/15 px-3 py-1.5 text-sm font-semibold text-yellow-400 border border-yellow-500/20">
        <Clock3 size={16} />
        Pending
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-5 sm:px-6 py-8 lg:py-10 w-full">
        <Link
          to="/my-jobs"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-cyan-400 transition mb-7"
        >
          <ArrowLeft size={17} />
          Back to My Jobs
        </Link>

        <div className="mb-8">
          <p className="text-sm font-semibold text-cyan-400 mb-2">
            APPLICATIONS
          </p>

          <h1 className="text-3xl sm:text-4xl font-bold">
            {job?.title || "Job Applicants"}
          </h1>

          {job && (
            <p className="mt-2 text-[var(--text-secondary)]">
              Review developers who applied for this project.
            </p>
          )}
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-12 text-center">
            <div className="w-10 h-10 mx-auto rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />

            <p className="mt-4 text-[var(--text-secondary)]">
              Loading applicants...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
            <p className="text-red-400">{error}</p>

            <button
              type="button"
              onClick={fetchApplications}
              className="mt-5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2.5 font-semibold transition"
            >
              Try Again
            </button>
          </div>
        ) : jobApplications.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500/10 flex items-center justify-center">
              <User className="text-cyan-400" size={26} />
            </div>

            <h2 className="text-xl font-bold mt-5">
              No applicants yet
            </h2>

            <p className="text-[var(--text-secondary)] mt-2">
              Applications for this job will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {jobApplications.map((application) => (
              <article
                key={application._id}
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 hover:border-cyan-500/50 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                        <User className="text-cyan-400" size={21} />
                      </div>

                      <div>
                        <h2 className="text-xl font-bold">
                          {application.developer?.username ||
                            "Developer"}
                        </h2>

                        <p className="text-sm text-[var(--text-secondary)] flex items-center gap-2 mt-1">
                          <Mail size={14} />
                          {application.developer?.email || "No email"}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-[var(--text-secondary)] mt-4">
                      Applied{" "}
                      {application.createdAt
                        ? new Date(
                            application.createdAt,
                          ).toLocaleDateString()
                        : "Recently"}
                    </p>
                  </div>

                  {getStatusBadge(application.status)}
                </div>

                <div className="mt-6 pt-6 border-t border-[var(--border-color)]">
                  <h3 className="font-semibold mb-3">
                    Cover Letter
                  </h3>

                  <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] p-4">
                    <p className="text-[var(--text-secondary)] leading-7 whitespace-pre-line">
                      {application.coverLetter ||
                        "No cover letter provided."}
                    </p>
                  </div>
                </div>

                {application.status === "pending" && (
                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <button
                      type="button"
                      disabled={updatingId === application._id}
                      onClick={() =>
                        handleStatus(
                          application._id,
                          "accepted",
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 font-semibold transition disabled:opacity-50"
                    >
                      <CheckCircle size={17} />
                      {updatingId === application._id
                        ? "Updating..."
                        : "Accept"}
                    </button>

                    <button
                      type="button"
                      disabled={updatingId === application._id}
                      onClick={() =>
                        handleStatus(
                          application._id,
                          "rejected",
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 font-semibold transition disabled:opacity-50"
                    >
                      <XCircle size={17} />
                      Reject
                    </button>
                  </div>
                )}

                {application.status === "accepted" && (
                  <div className="mt-6">
                    {application.paymentStatus === "paid" ? (
                      <div className="inline-flex items-center gap-2 text-green-400 font-semibold">
                        <CheckCircle size={18} />
                        Developer Paid
                      </div>
                    ) : application.paymentStatus === "pending" ? (
                      <div className="inline-flex items-center gap-2 text-yellow-400 font-semibold">
                        <Clock3 size={18} />
                        Payment Pending
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          openPaymentModal(application._id)
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2.5 font-semibold transition"
                      >
                        <CreditCard size={17} />
                        Pay Developer
                      </button>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer />

      {paymentModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl">
            <h2 className="text-xl font-bold">
              Pay Developer
            </h2>

            <p className="text-sm text-[var(--text-secondary)] mt-2">
              Enter the M-Pesa number that should receive the
              payment request.
            </p>

            <form
              onSubmit={handlePayment}
              className="mt-5 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-2">
                  M-Pesa Phone Number
                </label>

                <input
                  type="tel"
                  inputMode="tel"
                  value={paymentPhoneNumber}
                  onChange={(event) =>
                    setPaymentPhoneNumber(
                      event.target.value,
                    )
                  }
                  placeholder="0712345678"
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={paymentLoading}
                  className="flex-1 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-3 font-semibold transition disabled:opacity-50"
                >
                  {paymentLoading
                    ? "Sending..."
                    : "Send STK Push"}
                </button>

                <button
                  type="button"
                  disabled={paymentLoading}
                  onClick={closePaymentModal}
                  className="flex-1 rounded-lg border border-[var(--border-color)] px-4 py-3 font-semibold hover:bg-[var(--bg-primary)] transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobApplicants;
