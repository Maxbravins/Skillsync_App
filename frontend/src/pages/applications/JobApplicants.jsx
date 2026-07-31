import { CheckCircle, FileText, Mail, User, XCircle } from "lucide-react";
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
  const [paymentModal, setPaymentModal] = useState({
    open: false,
    applicationId: null,
  });
  const [paymentPhoneNumber, setPaymentPhoneNumber] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      const data = await getJobApplications(jobId);
      setApplications(data.applications || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleStatus = async (applicationId, status) => {
    try {
      await updateApplicationStatus(applicationId, status);
      fetchApplications();
    } catch (error) {
      console.log(error);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    if (!paymentModal.applicationId || !paymentPhoneNumber.trim()) return;

    setPaymentLoading(true);

    try {
      const res = await initiatePayment(
        paymentModal.applicationId,
        paymentPhoneNumber.trim(),
      );
      alert(res.message || t("paymentSuccess"));
      setPaymentModal({ open: false, applicationId: null });
      setPaymentPhoneNumber("");
      fetchApplications();
    } catch (error) {
      alert(error.response?.data?.message || t("paymentFailed"));
    } finally {
      setPaymentLoading(false);
    }
  };

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

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="mb-10">
            <h1 className="text-4xl font-bold">{t("jobApplicantsTitle")}</h1>
            <p className="text-[var(--text-secondary)] mt-2">
              {t("reviewApplications")}
            </p>
          </div>

          {applications.length === 0 ? (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-12 text-center">
              <h2 className="text-2xl font-bold mb-3">
                {t("noApplicationsYet")}
              </h2>
              <p className="text-[var(--text-secondary)]">
                {t("noApplicationsYetDesc")}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {applications.map((application) => (
                <div
                  key={application._id}
                  className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 hover:border-cyan-500 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-cyan-400" />
                        <h2 className="text-xl font-bold">
                          {application.developer?.username}
                        </h2>
                      </div>

                      <div className="flex items-center gap-2 mt-2 text-[var(--text-secondary)]">
                        <Mail className="w-4 h-4" />
                        {application.developer?.email}
                      </div>
                    </div>

                    <span
                      className={`px-4 py-1 rounded-full text-sm font-semibold capitalize ${
                        application.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : application.status === "accepted"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {application.status}
                    </span>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-cyan-400" />
                      <h3 className="font-semibold">{t("coverLetter")}</h3>
                    </div>

                    <p className="text-[var(--text-primary)] leading-7 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-4">
                      {application.coverLetter}
                    </p>
                  </div>

                  {application.status === "pending" && (
                    <div className="flex gap-4 mt-6">
                      <button
                        onClick={() =>
                          handleStatus(application._id, "accepted")
                        }
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg transition font-medium"
                      >
                        <CheckCircle size={18} />
                        {t("accept")}
                      </button>

                      <button
                        onClick={() =>
                          handleStatus(application._id, "rejected")
                        }
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg transition font-medium"
                      >
                        <XCircle size={18} />
                        {t("reject")}
                      </button>
                    </div>
                  )}

                  {application.status === "accepted" &&
                    application.paymentStatus !== "paid" && (
                      <button
                        onClick={() =>
                          setPaymentModal({
                            open: true,
                            applicationId: application._id,
                          })
                        }
                        className="mt-6 bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2 rounded-lg transition font-medium"
                      >
                        {t("payDeveloper")}
                      </button>
                    )}

                  {application.paymentStatus === "paid" && (
                    <div className="mt-6 text-green-400 font-semibold">
                      {t("developerPaid")}
                    </div>
                  )}

                  {application.paymentStatus === "pending" && (
                    <div className="mt-6 text-yellow-400 font-semibold">
                      {t("paymentPendingApproval")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {paymentModal.open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-2">
              {t("payDeveloperTitle")}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              {t("payDeveloperDescription")}
            </p>

            <form onSubmit={handlePayment} className="space-y-4">
              <input
                type="tel"
                inputMode="tel"
                value={paymentPhoneNumber}
                onChange={(e) => setPaymentPhoneNumber(e.target.value)}
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
                  {paymentLoading ? t("paymentLoading") : t("sendSTKPush")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentModal({ open: false, applicationId: null });
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
