import {
  CheckCircle,
  FileText,
  Mail,
  User,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useLanguage } from "../../context/LanguageContext";

import {
  getClientApplications,
  updateApplicationStatus,
} from "../../services/application.service";

const ClientApplications = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();

  const filter = searchParams.get("status") || "all";

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getClientApplications();

      setApplications(data.applications || []);
    } catch (error) {
      console.error("Failed to fetch client applications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleStatus = async (applicationId, status) => {
    try {
      setProcessingId(applicationId);

      await updateApplicationStatus(applicationId, status);

      await fetchApplications();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to update application status."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const filteredApplications =
    filter === "all"
      ? applications
      : applications.filter(
          (application) => application.status === filter
        );

  const getTitle = () => {
    if (filter === "pending") return "Pending Applications";
    if (filter === "accepted") return "Accepted Applications";
    if (filter === "rejected") return "Rejected Applications";

    return "All Applications";
  };

  if (loading) {
    return (
      <>
        <Navbar />

        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center text-[var(--text-primary)]">
          <p className="text-xl">
            Loading applications...
          </p>
        </div>

        <Footer />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold">
            {getTitle()}
          </h1>

          <p className="mt-2 text-[var(--text-secondary)]">
            Review developers who have applied to your jobs.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">

          <Link
            to="/applications"
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === "all"
                ? "bg-cyan-600 text-white"
                : "bg-[var(--bg-secondary)] border border-[var(--border-color)]"
            }`}
          >
            All ({applications.length})
          </Link>

          <Link
            to="/applications?status=pending"
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === "pending"
                ? "bg-yellow-600 text-white"
                : "bg-[var(--bg-secondary)] border border-[var(--border-color)]"
            }`}
          >
            Pending (
            {
              applications.filter(
                (application) =>
                  application.status === "pending"
              ).length
            }
            )
          </Link>

          <Link
            to="/applications?status=accepted"
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === "accepted"
                ? "bg-green-600 text-white"
                : "bg-[var(--bg-secondary)] border border-[var(--border-color)]"
            }`}
          >
            Accepted (
            {
              applications.filter(
                (application) =>
                  application.status === "accepted"
              ).length
            }
            )
          </Link>

          <Link
            to="/applications?status=rejected"
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === "rejected"
                ? "bg-red-600 text-white"
                : "bg-[var(--bg-secondary)] border border-[var(--border-color)]"
            }`}
          >
            Rejected (
            {
              applications.filter(
                (application) =>
                  application.status === "rejected"
              ).length
            }
            )
          </Link>
        </div>

        {/* No applications */}
        {filteredApplications.length === 0 ? (
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-[var(--text-secondary)]" />

            <h2 className="text-2xl font-bold mb-3">
              No applications found
            </h2>

            <p className="text-[var(--text-secondary)]">
              There are no applications matching this filter.
            </p>
          </div>
        ) : (
          /* Applications */
          <div className="space-y-6">
            {filteredApplications.map((application) => (
              <div
                key={application._id}
                className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6"
              >

                {/* Developer + Status */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                  <div>
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-cyan-400" />

                      <h2 className="text-xl font-bold">
                        {application.developer?.username ||
                          "Unknown Developer"}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2 mt-2 text-[var(--text-secondary)]">
                      <Mail className="w-4 h-4" />

                      {application.developer?.email ||
                        "No email available"}
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

                {/* Job */}
                <div className="mt-6">
                  <p className="text-sm text-[var(--text-secondary)]">
                    Applied for
                  </p>

                  <h3 className="text-lg font-bold mt-1">
                    {application.job?.title ||
                      "Unknown Job"}
                  </h3>
                </div>

                {/* Cover Letter */}
                <div className="mt-6">

                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-cyan-400" />

                    <h3 className="font-semibold">
                      Cover Letter
                    </h3>
                  </div>

                  <p className="leading-7 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-4">
                    {application.coverLetter}
                  </p>
                </div>

                {/* Actions */}
                {application.status === "pending" && (
                  <div className="flex flex-wrap gap-4 mt-6">

                    <button
                      disabled={processingId === application._id}
                      onClick={() =>
                        handleStatus(
                          application._id,
                          "accepted"
                        )
                      }
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg transition font-medium"
                    >
                      <CheckCircle size={18} />

                      {processingId === application._id
                        ? "Processing..."
                        : "Accept"}
                    </button>

                    <button
                      disabled={processingId === application._id}
                      onClick={() =>
                        handleStatus(
                          application._id,
                          "rejected"
                        )
                      }
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg transition font-medium"
                    >
                      <XCircle size={18} />

                      Reject
                    </button>

                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ClientApplications;