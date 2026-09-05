import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Briefcase,
  Clock3,
  CheckCircle,
  XCircle,
  Plus,
  RefreshCw,
  AlertCircle,
  Bell,
  User,
  Users,
} from "lucide-react";
import { getClientDashboard } from "../../services/dashboard.service";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const ClientDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getClientDashboard();

      setStats(data?.dashboard || {});
    } catch (err) {
      console.error("Client Dashboard Error:", err);

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

        const data = await getClientDashboard();

        if (isMounted) {
          setStats(data?.dashboard || {});
        }
      } catch (err) {
        console.error("Client Dashboard Error:", err);

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
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-10">
          <div>
            <p className="text-cyan-400 font-semibold mb-2">
              Client Workspace
            </p>

            <h1 className="text-4xl font-bold">
              Client Dashboard
            </h1>

            <p className="mt-2 text-[var(--text-secondary)] max-w-2xl">
              Manage your job postings, review developer applications,
              and find the right talent for your projects.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={fetchDashboard}
              disabled={loading}
              className="inline-flex items-center gap-2 border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-cyan-500 px-4 py-3 rounded-xl font-semibold transition disabled:opacity-50"
            >
              <RefreshCw
                size={18}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <Link
              to="/create-job"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white px-5 py-3 rounded-xl font-semibold hover:opacity-90 transition"
            >
              <Plus size={19} />
              Create Job
            </Link>
          </div>
        </div>

        {/* =====================================================
            ERROR STATE
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-40 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] animate-pulse"
              />
            ))}
          </div>
        )}

        {/* =====================================================
            DASHBOARD STATISTICS
        ====================================================== */}

        {stats && (
          <>
            <section className="mb-12">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-2xl font-bold">
                    Application Statistics
                  </h2>

                  <p className="text-[var(--text-secondary)] mt-1">
                    Monitor developer applications across your jobs.
                  </p>
                </div>

                <Briefcase
                  size={28}
                  className="text-cyan-400 hidden sm:block"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

                <DashboardCard
                  to="/applications"
                  label="Applications"
                  value={totalApplications}
                  icon={<Briefcase size={32} />}
                  color="text-cyan-400"
                  hover="hover:border-cyan-500"
                />

                <DashboardCard
                  to="/applications?status=pending"
                  label="Pending"
                  value={pendingApplications}
                  icon={<Clock3 size={32} />}
                  color="text-yellow-400"
                  hover="hover:border-yellow-500"
                />

                <DashboardCard
                  to="/applications?status=accepted"
                  label="Accepted"
                  value={acceptedApplications}
                  icon={<CheckCircle size={32} />}
                  color="text-green-400"
                  hover="hover:border-green-500"
                />

                <DashboardCard
                  to="/applications?status=rejected"
                  label="Rejected"
                  value={rejectedApplications}
                  icon={<XCircle size={32} />}
                  color="text-red-400"
                  hover="hover:border-red-500"
                />

              </div>
            </section>

            {/* =================================================
                APPLICATION OVERVIEW
            ================================================== */}

            <section className="mb-12">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 md:p-8">

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">
                  <div>
                    <h2 className="text-2xl font-bold">
                      Application Overview
                    </h2>

                    <p className="text-[var(--text-secondary)] mt-1">
                      See how developers are responding to your job
                      opportunities.
                    </p>
                  </div>

                  <Link
                    to="/applications"
                    className="text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    View applications →
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
          </>
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
              Manage your jobs, profile, and developer applications.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">

            <ActionCard
              to="/create-job"
              icon={<Plus size={24} />}
              title="Post a Job"
              description="Create a new job and find the right developer for your project."
              color="text-cyan-400"
            />

            <ActionCard
              to="/my-jobs"
              icon={<Briefcase size={24} />}
              title="My Jobs"
              description="View, edit, and manage all of your posted jobs."
              color="text-indigo-400"
            />

            <ActionCard
              to="/profile"
              icon={<User size={24} />}
              title="Company Profile"
              description="Update your personal and company information."
              color="text-green-400"
            />

            <ActionCard
              to="/notifications"
              icon={<Bell size={24} />}
              title="Notifications"
              description="Stay updated about applications and job activity."
              color="text-yellow-400"
            />

          </div>
        </section>

        {/* =====================================================
            HIRING CTA
        ====================================================== */}

        <section className="mt-12">
          <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-purple-500/10 p-8">

            <div className="absolute -right-16 -top-16 w-40 h-40 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="absolute -left-16 -bottom-16 w-40 h-40 rounded-full bg-indigo-500/10 blur-3xl" />

            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Users className="text-cyan-400" size={25} />

                  <h2 className="text-xl font-bold">
                    Looking for more developers?
                  </h2>
                </div>

                <p className="text-[var(--text-secondary)] max-w-2xl">
                  Post a new opportunity and connect with skilled
                  developers who can help bring your project to life.
                </p>
              </div>

              <Link
                to="/create-job"
                className="shrink-0 inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-xl font-semibold transition"
              >
                <Plus size={19} />
                Post a Job
              </Link>

            </div>
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
  label,
  value,
  icon,
  color,
  hover,
}) => {
  return (
    <Link
      to={to}
      className={`group bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 ${hover} transition`}
    >
      <div className={`${color} mb-4`}>
        {icon}
      </div>

      <p className="text-[var(--text-secondary)]">
        {label}
      </p>

      <h3 className="text-4xl font-bold mt-2 group-hover:translate-x-1 transition-transform">
        {value}
      </h3>
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

export default ClientDashboard;
