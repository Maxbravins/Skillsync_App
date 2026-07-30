import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Briefcase, Clock3, CheckCircle, XCircle } from "lucide-react";
import { getDeveloperDashboard } from "../../services/dashboard.service";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useLanguage } from "../../context/LanguageContext";

const DeveloperDashboard = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboard = async () => {
      try {
        const data = await getDeveloperDashboard();
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
   <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans transition-colors">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold">Developer {t("dashboard")}</h1>
            <p className="text-[var(--text-secondary)] mt-2">
              Track your applications and discover new freelance opportunities.
            </p>
          </div>

          <Link
            to="/jobs"
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-3 rounded-lg font-semibold"
          >
            {t("browseJobs")}
          </Link>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Link
              to="/my-applications"
              className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)] hover:border-cyan-500 transition"
            >
              <Briefcase className="text-cyan-400 mb-4" size={34} />
              <p className="text-[var(--text-secondary)]">Total Applications</p>
              <h2 className="text-4xl font-bold mt-2">
                {stats.totalApplications}
              </h2>
            </Link>

            <Link
              to="/my-applications?status=pending"
              className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)] hover:border-yellow-500 transition"
            >
              <Clock3 className="text-yellow-400 mb-4" size={34} />
              <p className="text-[var(--text-secondary)]">{t("pending")}</p>
              <h2 className="text-4xl font-bold mt-2">
                {stats.pendingApplications}
              </h2>
            </Link>

            <Link
              to="/my-applications?status=accepted"
              className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)] hover:border-green-500 transition"
            >
              <CheckCircle className="text-green-400 mb-4" size={34} />
              <p className="text-[var(--text-secondary)]">{t("accepted")}</p>
              <h2 className="text-4xl font-bold mt-2">
                {stats.acceptedApplications}
              </h2>
            </Link>

            <Link
              to="/my-applications?status=rejected"
              className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)] hover:border-red-500 transition"
            >
              <XCircle className="text-red-400 mb-4" size={34} />
              <p className="text-[var(--text-secondary)]">{t("rejected")}</p>
              <h2 className="text-4xl font-bold mt-2">
                {stats.rejectedApplications}
              </h2>
            </Link>
          </div>
        )}

        <h2 className="text-2xl font-bold mb-5">Quick Actions</h2>

        <div className="grid md:grid-cols-4 gap-6">
          <Link
            to="/jobs"
            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 hover:border-cyan-500 transition"
          >
            <h3 className="font-bold text-lg">{t("browseJobs")}</h3>
            <p className="text-[var(--text-secondary)] mt-3">
              Find freelance projects that match your skills.
            </p>
          </Link>

          <Link
            to="/my-applications"
            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 hover:border-cyan-500 transition"
          >
            <h3 className="font-bold text-lg">{t("applications")}</h3>
            <p className="text-[var(--text-secondary)] mt-3">
              Track every application you've submitted.
            </p>
          </Link>

          <Link
            to="/profile"
            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 hover:border-cyan-500 transition"
          >
            <h3 className="font-bold text-lg">{t("profile")}</h3>
            <p className="text-[var(--text-secondary)] mt-3">
              Update your developer profile and skills.
            </p>
          </Link>

          <Link
            to="/notifications"
            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 hover:border-cyan-500 transition"
          >
            <h3 className="font-bold text-lg">{t("notifications")}</h3>
            <p className="text-[var(--text-secondary)] mt-3">
              View job updates and client responses.
            </p>
          </Link>
        </div>
      </div> 
      <Footer />
    </div>
  );
};

export default DeveloperDashboard;