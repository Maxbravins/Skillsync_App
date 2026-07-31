import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getClientDashboard } from "../../services/dashboard.service";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useLanguage } from "../../context/LanguageContext";

const ClientDashboard = () => {
  const { t } = useLanguage();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboard = async () => {
      try {
        const data = await getClientDashboard();

        if (isMounted) {
          setStats(data.dashboard);
        }
      } catch (error) {
        console.log(error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-bold">
              Client {t("dashboard")}
            </h1>

            <p className="mt-2 text-[var(--text-secondary)]">
              {t("clientDashboardSubtitle")}
            </p>
          </div>

          <Link
            to="/create-job"
            className="bg-gradient-to-r from-cyan-500 to-indigo-500 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition"
          >
            + {t("createJob")}
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-lg text-[var(--text-secondary)]">
            {t("loadingDashboard")}
          </div>
        ) : (
          <>
            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-6">
                {t("dashboardStatistics")}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <Link
                  to="/applications"
                  className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 hover:border-cyan-500 hover:scale-105 transition"
                >
                  <p className="text-cyan-400 uppercase text-sm font-semibold">
                    {t("applications")}
                  </p>

                  <h3 className="text-4xl font-bold mt-4">
                    {stats?.totalApplications || 0}
                  </h3>
                </Link>

                <Link
                    to="/my-jobs"
                    className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 hover:border-yellow-500 hover:scale-105 transition"
                  >
                    <p className="text-yellow-400 uppercase text-sm font-semibold">
                      {t("pending")}
                    </p>

                    <h3 className="text-4xl font-bold mt-4">
                      {stats?.pendingApplications || 0}
                    </h3>
                  </Link>

                <Link
                  to="/my-jobs"
                  className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 hover:border-green-500 hover:scale-105 transition"
                >
                  <p className="text-green-400 uppercase text-sm font-semibold">
                    {t("accepted")}
                  </p>

                  <h3 className="text-4xl font-bold mt-4">
                    {stats?.acceptedApplications || 0}
                  </h3>
                </Link>

                <Link
                to="/my-jobs"
                className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 hover:border-red-500 hover:scale-105 transition"
              >
                <p className="text-red-400 uppercase text-sm font-semibold">
                  {t("rejected")}
                </p>

                <h3 className="text-4xl font-bold mt-4">
                  {stats?.rejectedApplications || 0}
                </h3>
              </Link>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-6">
                {t("quickActions")}
              </h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link
                  to="/create-job"
                  className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 hover:border-cyan-500 transition"
                >
                  <h3 className="font-bold text-lg">{t("createJob")}</h3>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {t("createJobDesc")}
                  </p>
                </Link>

                <Link
                  to="/my-jobs"
                  className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 hover:border-cyan-500 transition"
                >
                  <h3 className="font-bold text-lg">{t("myJobs")}</h3>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {t("myJobsDesc")}
                  </p>
                </Link>

                <Link
                  to="/profile"
                  className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 hover:border-cyan-500 transition"
                >
                  <h3 className="font-bold text-lg">{t("profile")}</h3>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {t("profileDesc")}
                  </p>
                </Link>

                <Link
                  to="/notifications"
                  className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 hover:border-cyan-500 transition"
                >
                  <h3 className="font-bold text-lg">{t("notifications")}</h3>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {t("notificationsDesc")}
                  </p>
                </Link>
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ClientDashboard;