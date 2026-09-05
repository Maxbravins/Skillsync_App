import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Briefcase,
  Clock3,
  CheckCircle,
  XCircle,
  User,
  Bell,
  Search,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { getDeveloperDashboard } from "../../services/dashboard.service";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const DeveloperDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getDeveloperDashboard();

      setStats(data?.dashboard || {});
    } catch (err) {
      console.error("Developer Dashboard Error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load your dashboard. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getDeveloperDashboard();

        if (isMounted) {
          setStats(data?.dashboard || {});
        }
      } catch (err) {
        console.error("Developer Dashboard Error:", err);

        if (isMounted) {
          setError(
            err?.response?.data?.message ||
              "Unable to load your dashboard. Please try again."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalApplications = stats?.totalApplications || 0;
  const pendingApplications = stats?.pendingApplications || 0;
  const acceptedApplications = stats?.acceptedApplications || 0;
  const rejectedApplications = stats?.rejectedApplications || 0;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-10">
          <div>
            <p className="text-cyan-400 font-semibold mb-2">
              Developer Workspace
            </p>

            <h1 className="text-4xl font-bold">
              Developer Dashboard
            </h1>

            <p className="text-[var(--text-secondary)] mt-2 max-w-2xl">
              Track your applications, monitor opportunities, and manage
              your developer profile from one place.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={fetchDashboard}
              disabled={loading}
              className="inline-flex items-center gap-2 border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-cyan-500 px-4 py-3 rounded-lg font-semibold transition disabled:opacity-50"
            >
              <RefreshCw
                size={18}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-3 rounded-lg font-semibold transition"
            >
              <Search size={18} />
              Browse Jobs
            </Link>
          </div>
        </div>

        {/* =====================================================
            ERROR
        ====================================================== */}

        {error && (
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-red-500/30 bg-red-500/10 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={22}
                className="text-red-400 mt-0.5 shrink-0"
              />

              <div>
                <p className="font-semibold text-red-400">
                  Dashboard unavailable
                </p>

                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  {error}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchDashboard}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* =====================================================
            LOADING STATE
        ====================================================== */}

        {loading && !stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-40 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] animate-pulse"
              />
            ))}
          </div>
        )}

        {/* =====================================================
            APPLICATION STATISTICS
        ====================================================== */}

        {!loading || stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">

            <DashboardCard
              to="/my-applications"
              icon={<Briefcase size={34} />}
              iconColor="text-cyan-400"
              hoverColor="hover:border-cyan-500"
              label="Total Applications"
              value={totalApplications}
            />

            <DashboardCard
              to="/my-applications?status=pending"
              icon={<Clock3 size={34} />}
              iconColor="text-yellow-400"
              hoverColor="hover:border-yellow-500"
              label="Pending"
              value={pendingApplications}
            />

            <DashboardCard
              to="/my-applications?status=accepted"
              icon={<CheckCircle size={34} />}
              iconColor="text-green-400"
              hoverColor="hover:border-green-500"
              label="Accepted"
              value={acceptedApplications}
            />

            <DashboardCard
              to="/my-applications?status=rejected"
              icon={<XCircle size={34} />}
              iconColor="text-red-400"
              hoverColor="hover:border-red-500"
              label="Rejected"
              value={rejectedApplications}
            />

          </div>
        ) : null}

        {/* =====================================================
            APPLICATION OVERVIEW
        ====================================================== */}

        {stats && (
          <section className="mb-12">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 md:p-8">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold">
                    Application Overview
                  </h2>

                  <p className="text-[var(--text-secondary)] mt-1">
                    A quick look at how your applications are performing.
                  </p>
                </div>

                <Link
                  to="/my-applications"
                  className="text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  View all applications →
                </Link>
              </div>

              <div className="space-y-5">

                <ProgressRow
                  label="Accepted"
                  value={acceptedApplications}
                  total={totalApplications}
                  color="bg-green-500"
                />

                <ProgressRow
                  label="Pending"
                  value={pendingApplications}
                  total={totalApplications}
                  color="bg-yellow-500"
                />

                <ProgressRow
                  label="Rejected"
                  value={rejectedApplications}
                  total={totalApplications}
                  color="bg-red-500"
                />

              </div>
            </div>
          </section>
        )}

        {/* =====================================================
            QUICK ACTIONS
        ====================================================== */}

        <section>
          <div className="mb-5">
            <h2 className="text-2xl font-bold">
              Quick Actions
            </h2>

            <p className="text-[var(--text-secondary)] mt-1">
              Quickly access the tools you use most.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">

            <ActionCard
              to="/jobs"
              icon={<Search size={24} />}
              title="Browse Jobs"
              description="Find freelance projects that match your skills."
              color="text-cyan-400"
            />

            <ActionCard
              to="/my-applications"
              icon={<Briefcase size={24} />}
              title="Applications"
              description="Track every application you've submitted."
              color="text-indigo-400"
            />

            <ActionCard
              to="/profile"
              icon={<User size={24} />}
              title="My Profile"
              description="Update your developer profile, skills, and information."
              color="text-green-400"
            />

            <ActionCard
              to="/notifications"
              icon={<Bell size={24} />}
              title="Notifications"
              description="View job updates and responses from clients."
              color="text-yellow-400"
            />

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

/* =============================================================
   DASHBOARD STAT CARD
============================================================= */

const DashboardCard = ({
  to,
  icon,
  iconColor,
  hoverColor,
  label,
  value,
}) => {
  return (
    <Link
      to={to}
      className={`group bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)] ${hoverColor} transition`}
    >
      <div className={`${iconColor} mb-4`}>
        {icon}
      </div>

      <p className="text-[var(--text-secondary)]">
        {label}
      </p>

      <h2 className="text-4xl font-bold mt-2 group-hover:translate-x-1 transition-transform">
        {value}
      </h2>
    </Link>
  );
};

/* =============================================================
   PROGRESS ROW
============================================================= */

const ProgressRow = ({
  label,
  value,
  total,
  color,
}) => {
  const percentage =
    total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium">
          {label}
        </span>

        <span className="text-sm text-[var(--text-secondary)]">
          {value} ({percentage}%)
        </span>
      </div>

      <div className="h-2 rounded-full bg-[var(--bg-primary)] overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

/* =============================================================
   QUICK ACTION CARD
============================================================= */

const ActionCard = ({
  to,
  icon,
  title,
  description,
  color,
}) => {
  return (
    <Link
      to={to}
      className="group bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 hover:border-cyan-500 transition"
    >
      <div
        className={`w-11 h-11 rounded-lg bg-[var(--bg-primary)] flex items-center justify-center ${color} mb-5 group-hover:scale-105 transition-transform`}
      >
        {icon}
      </div>

      <h3 className="font-bold text-lg">
        {title}
      </h3>

      <p className="text-[var(--text-secondary)] mt-3 leading-relaxed">
        {description}
      </p>
    </Link>
  );
};

export default DeveloperDashboard;
