import {
  CheckCircle,
  FileText,
  Mail,
  User,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { useLanguage } from "../../context/LanguageContext";
import {
  getJobApplications,
  updateApplicationStatus,
} from "../../services/application.service";
import { initiatePayment } from "../../services/mpesa.service";

const JobApplicants = () => {
  const { jobId } = useParams();
  const { t } = useLanguage();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Application filter
  const [statusFilter, setStatusFilter] = useState("all");

  // Payment modal
  const [paymentModal, setPaymentModal] = useState({
    open: false,
    applicationId: null,
  });

  const [paymentPhoneNumber, setPaymentPhoneNumber] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);

  // --------------------------------------------------
  // FETCH APPLICATIONS
  // --------------------------------------------------

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getJobApplications(jobId);

      setApplications(data.applications || []);
    } catch (error) {
      console.error("Failed to fetch applications:", error);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // --------------------------------------------------
  // FILTER APPLICATIONS
  // --------------------------------------------------

  const filteredApplications =
    statusFilter === "all"
      ? applications
      : applications.filter(
          (application) =>
            application.status === statusFilter
        );

  // --------------------------------------------------
  // UPDATE APPLICATION STATUS
  // --------------------------------------------------

  const handleStatus = async (applicationId, status) => {
    try {
      await updateApplicationStatus(
        applicationId,
        status
      );

      await fetchApplications();

      // If we accepted an application, the backend
      // automatically rejects the other pending ones.
      if (status === "accepted") {
        setStatusFilter("accepted");
      }
    } catch (error) {
      console.error(
        "Failed to update application:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to update application."
      );
    }
  };

  // --------------------------------------------------
  // PAYMENT
  // --------------------------------------------------

  const handlePayment = async (e) => {
    e.preventDefault();

    if (
      !paymentModal.applicationId ||
      !paymentPhoneNumber.trim()
    ) {
      return;
    }

    setPaymentLoading(true);

    try {
      const res = await initiatePayment(
        paymentModal.applicationId,
        paymentPhoneNumber.trim()
      );

      alert(
        res.message ||
          t("paymentSuccess")
      );

      setPaymentModal({
        open: false,
        applicationId: null,
      });

      setPaymentPhoneNumber("");

      await fetchApplications();
    } catch (error) {
      console.error(
        "Payment error:",
        error
      );

      alert(
        error.response?.data?.message ||
          t("paymentFailed")
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <>
        <Navbar />

        <div className="min-h-screen bg-[var(--bg-primary)] flex justify-center items-center text-[var(--text-primary)] text-xl">
          {t("loadingApplicants")}
        </div>
      </>
    );
  }

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
        <div className="max-w-6xl mx-auto px-6 py-10">

          {/* HEADER */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold">
              {t("jobApplicantsTitle")}
            </h1>

            <p className="text-[var(--text-secondary)] mt-2">
              {t("reviewApplications")}
            </p>
          </div>

          {/* --------------------------------------------------
              APPLICATION FILTERS
          -------------------------------------------------- */}

          <div className="flex flex-wrap gap-3 mb-8">

            {/* ALL */}
            <button
              onClick={() =>
                setStatusFilter("all")
              }
              className={`px-5 py-2.5 rounded-xl font-semibold border transition ${
                statusFilter === "all"
                  ? "bg-cyan-600 border-cyan-500 text-white"
                  : "bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-cyan-500 hover:text-cyan-400"
              }`}
            >
              All
              <span className="ml-2 opacity-80">
                {applications.length}
              </span>
            </button>

            {/* PENDING */}
            <button
              onClick={() =>
                setStatusFilter("pending")
              }
              className={`px-5 py-2.5 rounded-xl font-semibold border transition ${
                statusFilter === "pending"
                  ? "bg-yellow-600 border-yellow-500 text-white"
                  : "bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-yellow-500 hover:text-yellow-400"
              }`}
            >
              Pending
              <span className="ml-2 opacity-80">
                {
                  applications.filter(
                    (app) =>
                      app.status === "pending"
                  ).length
                }
              </span>
            </button>

            {/* ACCEPTED */}
            <button
              onClick={() =>
                setStatusFilter("accepted")
              }
              className={`px-5 py-2.5 rounded-xl font-semibold border transition ${
                statusFilter === "accepted"
                  ? "bg-green-600 border-green-500 text-white"
                  : "bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-green-500 hover:text-green-400"
              }`}
            >
              Accepted
              <span className="ml-2 opacity-80">
                {
                  applications.filter(
                    (app) =>
                      app.status === "accepted"
                  ).length
                }
              </span>
            </button>

            {/* REJECTED */}
            <button
              onClick={() =>
                setStatusFilter("rejected")
              }
              className={`px-5 py-2.5 rounded-xl font-semibold border transition ${
                statusFilter === "rejected"
                  ? "bg-red-600 border-red-500 text-white"
                  : "bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-red-500 hover:text-red-400"
              }`}
            >
              Rejected
              <span className="ml-2 opacity-80">
                {
                  applications.filter(
                    (app) =>
                      app.status === "rejected"
                  ).length
                }
              </span>
            </button>
          </div>

          {/* --------------------------------------------------
              NO APPLICATIONS / NO FILTER RESULTS
          -------------------------------------------------- */}

          {filteredApplications.length === 0 ? (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-12 text-center">

              <User className="w-12 h-12 mx-auto mb-4 text-[var(--text-secondary)]" />

              <h2 className="text-2xl font-bold mb-3">
                {statusFilter === "pending"
                  ? "No pending applications"
                  : statusFilter === "accepted"
                    ? "No accepted applications"
                    : statusFilter === "rejected"
                      ? "No rejected applications"
                      : t("noApplicationsYet")}
              </h2>

              <p className="text-[var(--text-secondary)]">
                {statusFilter === "pending"
                  ? "There are currently no developers waiting for your review."
                  : statusFilter === "accepted"
                    ? "No developer has been accepted for this job yet."
                    : statusFilter === "rejected"
                      ? "There are currently no rejected applications."
                      : t("noApplicationsYetDesc")}
              </p>
            </div>
          ) : (
            <div className="space-y-6">

              {filteredApplications.map(
                (application) => (
                  <div
                    key={application._id}
                    className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 hover:border-cyan-500 transition"
                  >

                    {/* DEVELOPER INFORMATION */}
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                      <div>

                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-cyan-400" />

                          <h2 className="text-xl font-bold">
                            {application.developer
                              ?.username ||
                              "Unknown Developer"}
                          </h2>
                        </div>

                        <div className="flex items-center gap-2 mt-2 text-[var(--text-secondary)]">
                          <Mail className="w-4 h-4" />

                          {application.developer
                            ?.email ||
                            "No email available"}
                        </div>

                      </div>

                      {/* STATUS */}
                      <span
                        className={`px-4 py-1 rounded-full text-sm font-semibold capitalize ${
                          application.status ===
                          "pending"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : application.status ===
                                "accepted"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {application.status}
                      </span>

                    </div>

                    {/* COVER LETTER */}
                    <div className="mt-6">

                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-cyan-400" />

                        <h3 className="font-semibold">
                          {t("coverLetter")}
                        </h3>
                      </div>

                      <p className="text-[var(--text-primary)] leading-7 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-4">
                        {application.coverLetter}
                      </p>

                    </div>

                    {/* --------------------------------------------------
                        PENDING ACTIONS
                    -------------------------------------------------- */}

                    {application.status ===
                      "pending" && (
                      <div className="flex flex-wrap gap-4 mt-6">

                        <button
                          onClick={() =>
                            handleStatus(
                              application._id,
                              "accepted"
                            )
                          }
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg transition font-medium"
                        >
                          <CheckCircle
                            size={18}
                          />

                          {t("accept")}
                        </button>

                        <button
                          onClick={() =>
                            handleStatus(
                              application._id,
                              "rejected"
                            )
                          }
                          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg transition font-medium"
                        >
                          <XCircle
                            size={18}
                          />

                          {t("reject")}
                        </button>

                      </div>
                    )}

                    {/* --------------------------------------------------
                        ACCEPTED APPLICATION / PAYMENT
                    -------------------------------------------------- */}

                    {application.status ===
                      "accepted" && (
                      <div className="mt-6">

                        {application.paymentStatus ===
                        "paid" ? (
                          <div className="text-green-400 font-semibold">
                            {t("developerPaid")}
                          </div>
                        ) : application.paymentStatus ===
                          "pending" ? (
                          <div className="text-yellow-400 font-semibold">
                            {t(
                              "paymentPendingApproval"
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              setPaymentModal({
                                open: true,
                                applicationId:
                                  application._id,
                              })
                            }
                            className="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2 rounded-lg transition font-medium"
                          >
                            {t("payDeveloper")}
                          </button>
                        )}

                      </div>
                    )}

                  </div>
                )
              )}

            </div>
          )}

        </div>
      </div>

      {/* --------------------------------------------------
          PAYMENT MODAL
      -------------------------------------------------- */}

      {paymentModal.open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 w-full max-w-md">

            <h2 className="text-xl font-semibold mb-2">
              {t("payDeveloperTitle")}
            </h2>

            <p className="text-sm text-[var(--text-secondary)] mb-4">
              {t("payDeveloperDescription")}
            </p>

            <form
              onSubmit={handlePayment}
              className="space-y-4"
            >

              <input
                type="tel"
                inputMode="tel"
                value={paymentPhoneNumber}
                onChange={(e) =>
                  setPaymentPhoneNumber(
                    e.target.value
                  )
                }
                placeholder="0712345678"
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-[var(--text-primary)]"
                required
              />

              <div className="flex gap-3">

                <button
                  type="submit"
                  disabled={paymentLoading}
                  className="flex-1 rounded-lg bg-cyan-600 px-4 py-2 font-semibold hover:bg-cyan-700 disabled:opacity-60"
                >
                  {paymentLoading
                    ? t("paymentLoading")
                    : t("sendSTKPush")}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentModal({
                      open: false,
                      applicationId: null,
                    });

                    setPaymentPhoneNumber("");
                  }}
                  className="flex-1 rounded-lg border border-[var(--border-color)] px-4 py-2 font-semibold"
                >
                  {t("cancelButton")}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}
    </>
  );
};

export default JobApplicants;