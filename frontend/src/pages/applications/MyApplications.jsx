import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Briefcase, Clock3, CheckCircle, XCircle } from "lucide-react";
import Navbar from "../../components/Navbar";
import { getMyApplications } from "../../services/application.service";
import { useLanguage } from "../../context/LanguageContext";

const MyApplications = () => {
  const { t } = useLanguage();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");

  const fetchApplications = useCallback(async () => {
    try {
      const data = await getMyApplications();
      setApplications(data.applications || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const filteredApplications = status
    ? applications.filter((application) => application.status === status)
    : applications;

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="mb-10">
            <h1 className="text-4xl font-bold">{t("applications")}</h1>
            <p className="text-[var(--text-secondary)] mt-2">
              {status
                ? `Showing ${status} applications`
                : "Track every application you've submitted."}
            </p>
          </div>

          {loading ? (
            <div className="text-center text-[var(--text-secondary)] py-20">
              {t("loading")}
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-10 text-center">
              <h2 className="text-2xl font-bold">{t("noData")}</h2>
              <p className="text-[var(--text-secondary)] mt-3">
                No applications match this category.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredApplications.map((application) => (
                <div
                  key={application._id}
                  className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 hover:border-cyan-500 transition"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Briefcase className="text-cyan-400" size={30} />
                      <div>
                        <h2 className="text-xl font-bold">
                          {application.job?.title}
                        </h2>
                        <p className="text-[var(--text-secondary)]">
                          {t("budget")}: KES {application.job?.budget}
                        </p>
                      </div>
                    </div>

                    {application.status === "pending" && (
                      <span className="flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full font-medium">
                        <Clock3 size={18} />
                        {t("pending")}
                      </span>
                    )}

                    {application.status === "accepted" && (
                      <span className="flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full font-medium">
                        <CheckCircle size={18} />
                        {t("accepted")}
                      </span>
                    )}

                    {application.status === "rejected" && (
                      <span className="flex items-center gap-2 bg-red-500/20 text-red-400 px-4 py-2 rounded-full font-medium">
                        <XCircle size={18} />
                        {t("rejected")}
                      </span>
                    )}
                  </div>

                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">{t("coverLetter")}</h3>
                    <p className="text-[var(--text-primary)] leading-7 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-4">
                      {application.coverLetter}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MyApplications;