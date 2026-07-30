import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getClientDashboard } from "../../services/dashboard.service";
import Navbar from "../../components/Navbar";
import { useLanguage } from "../../context/LanguageContext";

const ClientDashboard = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboard = async () => {
      try {
        const data = await getClientDashboard();
        if (isMounted) setStats(data.dashboard);
      } catch (error) {
        console.log(error);
      }
    };
    fetchDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans transition-colors">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Client {t("dashboard")}</h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">Manage your job listings and track developer applications.</p>
          </div>
          <Link 
            to="/create-job"
            className="self-start md:self-auto px-5 py-2.5 font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 rounded-lg transition-all shadow-md shadow-cyan-950/20"
          >
            + {t("createJob")}
          </Link>
        </div>

        {stats && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-[var(--text-secondary)] mb-5">Dashboard Statistics</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {/* Total Jobs */}
              <Link
                to="/my-jobs"
                className="bg-[var(--bg-secondary)] backdrop-blur border border-[var(--border-color)] p-5 rounded-xl flex flex-col justify-between min-h-[120px] hover:border-indigo-500 hover:scale-105 transition-all cursor-pointer"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  {t("myJobs")}
                </span>

                <span className="text-3xl font-extrabold text-[var(--text-primary)] mt-2">
                  {stats.totalJobs}
                </span>
              </Link>

              {/* Total Applications */}
              <Link
                to="/job-applicants/all"
                className="bg-[var(--bg-secondary)] backdrop-blur border border-[var(--border-color)] p-5 rounded-xl flex flex-col justify-between min-h-[120px] hover:border-cyan-500 hover:scale-105 transition-all cursor-pointer"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  {t("applications")}
                </span>

                <span className="text-3xl font-extrabold text-[var(--text-primary)] mt-2">
                  {stats.totalApplications}
                </span>
              </Link>

              {/* Pending */}
              <Link
                to="/job-applicants/pending"
                className="bg-[var(--bg-secondary)] backdrop-blur border border-[var(--border-color)] p-5 rounded-xl flex flex-col justify-between min-h-[120px] hover:border-amber-500 hover:scale-105 transition-all cursor-pointer"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  {t("pending")}
                </span>

                <span className="text-3xl font-extrabold text-[var(--text-primary)] mt-2">
                  {stats.pendingApplications}
                </span>
              </Link>

              {/* Accepted */}
              <Link
                to="/job-applicants/accepted"
                className="bg-[var(--bg-secondary)] backdrop-blur border border-[var(--border-color)] p-5 rounded-xl flex flex-col justify-between min-h-[120px] hover:border-green-500 hover:scale-105 transition-all cursor-pointer"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  {t("accepted")}
                </span>

                <span className="text-3xl font-extrabold text-[var(--text-primary)] mt-2">
                  {stats.acceptedApplications}
                </span>
              </Link>

              {/* Rejected */}
              <Link
                to="/job-applicants/rejected"
                className="bg-[var(--bg-secondary)] backdrop-blur border border-[var(--border-color)] p-5 rounded-xl flex flex-col justify-between min-h-[120px] hover:border-red-500 hover:scale-105 transition-all cursor-pointer"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                  {t("rejected")}
                </span>

                <span className="text-3xl font-extrabold text-[var(--text-primary)] mt-2">
                  {stats.rejectedApplications}
                </span>
              </Link>
            </div>
          </section>
        )}

        <hr className="border-[var(--border-color)] my-10" />

        <section>
          <h2 className="text-lg font-semibold text-[var(--text-secondary)] mb-6 font-sans">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link 
              to="/create-job" 
              className="group bg-[var(--bg-secondary)] backdrop-blur border border-[var(--border-color)] hover:border-cyan-500/40 p-6 rounded-xl transition-all"
            >
              <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-cyan-400 transition-colors">{t("createJob")}</h3>
              <p className="text-[var(--text-secondary)] text-xs mt-2 leading-relaxed">Publish a new job listing to attract developers with specific skills.</p>
            </Link>

            <Link 
              to="/my-jobs" 
              className="group bg-[var(--bg-secondary)] backdrop-blur border border-[var(--border-color)] hover:border-cyan-500/40 p-6 rounded-xl transition-all"
            >
              <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-cyan-400 transition-colors">{t("myJobs")}</h3>
              <p className="text-[var(--text-secondary)] text-xs mt-2 leading-relaxed">Manage active jobs, view candidate counts, and update descriptions.</p>
            </Link>

            <Link 
              to="/profile" 
              className="group bg-[var(--bg-secondary)] backdrop-blur border border-[var(--border-color)] hover:border-cyan-500/40 p-6 rounded-xl transition-all"
            >
              <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-cyan-400 transition-colors">{t("profile")}</h3>
              <p className="text-[var(--text-secondary)] text-xs mt-2 leading-relaxed">View and edit your company information, logo, and contact details.</p>
            </Link>
            
            <Link 
              to="/notifications"
              className="group bg-[var(--bg-secondary)] backdrop-blur border border-[var(--border-color)] hover:border-cyan-500/40 p-6 rounded-xl transition-all"
            >
              <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-cyan-400 transition-colors">{t("notifications")}</h3> 
              <p className="text-[var(--text-secondary)] text-sm mt-2">Stay updated on new applications, accepted jobs, and account activity.</p>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ClientDashboard;