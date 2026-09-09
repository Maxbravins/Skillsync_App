import { Link } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
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
  ArrowRight,
  Bookmark,
  MessageSquare,
  TrendingUp,
} from "lucide-react";

import { getDeveloperDashboard } from "../../services/dashboard.service";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const DeveloperDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * ============================================================
   * FETCH DASHBOARD
   * ============================================================
   */

  const fetchDashboard = useCallback(async () => {
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
  }, []);

  /*
   * ============================================================
   * INITIAL LOAD
   * ============================================================
   */

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  /*
   * ============================================================
   * CURRENT API STATISTICS
   * ============================================================
   */

  const totalApplications = stats?.totalApplications || 0;
  const pendingApplications = stats?.pendingApplications || 0;
  const acceptedApplications = stats?.acceptedApplications || 0;
  const rejectedApplications = stats?.rejectedApplications || 0;

  /*
   * ============================================================
   * APPLICATION SUCCESS RATE
   * ============================================================
   */

  const successRate =
    totalApplications > 0
      ? Math.round((acceptedApplications / totalApplications) * 100)
      : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">

        {/* ======================================================
            HEADER
        ======================================================= */}

        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
          <div>
            <p className="text-cyan-400 font-semibold mb-2">
              Developer Workspace
            </p>

            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Find your next opportunity.
            </h1>

            <p className="text-[var(--text-secondary)] mt-3 max-w-2xl text-lg">
              Discover projects that match your skills, track your
              applications, and manage your freelance career from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
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
              to="/jobs"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:opacity-90 text-white px-5 py-3 rounded-xl font-semibold transition"
            >
              <Search size={18} />

              Browse Jobs
            </Link>
          </div>
        </header>

        {/* ======================================================
            ERROR STATE
        ======================================================= */}

        {error && (
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
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

        {/* ======================================================
            LOADING STATE
        ======================================================= */}

        {loading && !stats && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-40 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] animate-pulse"
                />
              ))}
            </div>

            <div className="h-72 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] animate-pulse" />
          </>
        )}

        {/* ======================================================
            DASHBOARD CONTENT
        ======================================================= */}

        {stats && (
          <>
            {/* ==================================================
                APPLICATION OVERVIEW CARDS
            =================================================== */}

            <section className="mb-12">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-2xl font-bold">
                    Application Overview
                  </h2>

                  <p className="text-[var(--text-secondary)] mt-1">
                    Keep track of the opportunities you've pursued.
                  </p>
                </div>

                <TrendingUp
                  size={27}
                  className="text-cyan-400 hidden sm:block"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

                <DashboardCard
                  to="/my-applications"
                  label="Applications"
                  value={totalApplications}
                  icon={<Briefcase size={29} />}
                  iconColor="text-cyan-400"
                  hoverColor="hover:border-cyan-500"
                />

                <DashboardCard
                  to="/my-applications?status=pending"
                  label="Pending"
                  value={pendingApplications}
                  icon={<Clock3 size={29} />}
                  iconColor="text-yellow-400"
                  hoverColor="hover:border-yellow-500"
                />

                <DashboardCard
                  to="/my-applications?status=accepted"
                  label="Accepted"
                  value={acceptedApplications}
                  icon={<CheckCircle size={29} />}
                  iconColor="text-green-400"
                  hoverColor="hover:border-green-500"
                />

                <DashboardCard
                  to="/my-applications?status=rejected"
                  label="Rejected"
                  value={rejectedApplications}
                  icon={<XCircle size={29} />}
                  iconColor="text-red-400"
                  hoverColor="hover:border-red-500"
                />

              </div>
            </section>

            {/* ==================================================
                OPPORTUNITIES + QUICK ACTIONS
            =================================================== */}

            <section className="grid lg:grid-cols-3 gap-6 mb-12">

              {/* ------------------------------------------------
                  FIND JOBS
              ------------------------------------------------- */}

              <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-indigo-500/10 to-purple-500/10 p-7 md:p-8">

                <div className="absolute -right-20 -top-20 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl" />

                <div className="absolute -left-20 -bottom-20 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl" />

                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-5">
                    <Search
                      size={25}
                      className="text-cyan-400"
                    />
                  </div>

                  <p className="text-cyan-400 font-semibold mb-2">
                    Keep growing
                  </p>

                  <h2 className="text-3xl font-bold">
                    Find projects that match your skills.
                  </h2>

                  <p className="text-[var(--text-secondary)] mt-3 max-w-2xl leading-relaxed">
                    Explore freelance opportunities, discover projects
                    from clients, and apply to work that fits your
                    experience and goals.
                  </p>

                  <div className="flex flex-wrap gap-3 mt-6">

                    <Link
                      to="/jobs"
                      className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-xl font-semibold transition"
                    >
                      <Search size={18} />

                      Browse Jobs

                      <ArrowRight size={17} />
                    </Link>

                    <Link
                      to="/my-applications"
                      className="inline-flex items-center gap-2 border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-cyan-500 px-6 py-3 rounded-xl font-semibold transition"
                    >
                      My Applications

                      <ArrowRight size={17} />
                    </Link>

                  </div>
                </div>
              </div>

              {/* ------------------------------------------------
                  QUICK ACTIONS
              ------------------------------------------------- */}

              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6">

                <h2 className="text-xl font-bold mb-5">
                  Quick Actions
                </h2>

                <div className="space-y-2">

                  <MiniAction
                    to="/jobs"
                    icon={<Search size={19} />}
                    title="Browse Jobs"
                    description="Discover new opportunities"
                    color="text-cyan-400"
                  />

                  <MiniAction
                    to="/my-applications"
                    icon={<Briefcase size={19} />}
                    title="My Applications"
                    description="Track your submissions"
                    color="text-indigo-400"
                  />

                  <MiniAction
                    to="/profile"
                    icon={<User size={19} />}
                    title="My Profile"
                    description="Update your developer profile"
                    color="text-green-400"
                  />

                  <MiniAction
                    to="/notifications"
                    icon={<Bell size={19} />}
                    title="Notifications"
                    description="Check your latest updates"
                    color="text-yellow-400"
                  />

                  <MiniAction
                    to="/messages"
                    icon={<MessageSquare size={19} />}
                    title="Messages"
                    description="Talk with clients"
                    color="text-purple-400"
                  />

                </div>
              </div>
            </section>

            {/* ==================================================
                APPLICATION ACTIVITY
            =================================================== */}

            <section className="mb-12">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 md:p-8">

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">

                  <div>
                    <h2 className="text-2xl font-bold">
                      Application Activity
                    </h2>

                    <p className="text-[var(--text-secondary)] mt-1">
                      See how your submitted applications are progressing.
                    </p>
                  </div>

                  <Link
                    to="/my-applications"
                    className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    View applications

                    <ArrowRight size={17} />
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

                {/* SUCCESS RATE */}

                <div className="mt-8 pt-6 border-t border-[var(--border-color)]">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                    <div>
                      <p className="font-semibold">
                        Application success rate
                      </p>

                      <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Percentage of your applications that have been accepted.
                      </p>
                    </div>

                    <div className="text-3xl font-bold text-green-400">
                      {successRate}%
                    </div>

                  </div>
                </div>

              </div>
            </section>

            {/* ==================================================
                APPLICATION STATUS
            =================================================== */}

            <section className="mb-12">

              <div className="flex items-end justify-between mb-5">
                <div>
                  <h2 className="text-2xl font-bold">
                    Application Status
                  </h2>

                  <p className="text-[var(--text-secondary)] mt-1">
                    Jump directly to applications by status.
                  </p>
                </div>

                <Link
                  to="/my-applications"
                  className="hidden sm:inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  View all
                  <ArrowRight size={17} />
                </Link>
              </div>

              <div className="grid sm:grid-cols-3 gap-5">

                <StatusCard
                  to="/my-applications?status=pending"
                  icon={<Clock3 size={24} />}
                  title="Pending"
                  value={pendingApplications}
                  description="Waiting for client response"
                  color="text-yellow-400"
                  border="hover:border-yellow-500"
                />

                <StatusCard
                  to="/my-applications?status=accepted"
                  icon={<CheckCircle size={24} />}
                  title="Accepted"
                  value={acceptedApplications}
                  description="Applications accepted"
                  color="text-green-400"
                  border="hover:border-green-500"
                />

                <StatusCard
                  to="/my-applications?status=rejected"
                  icon={<XCircle size={24} />}
                  title="Rejected"
                  value={rejectedApplications}
                  description="Applications not selected"
                  color="text-red-400"
                  border="hover:border-red-500"
                />

              </div>
            </section>

            {/* ==================================================
                PROFILE / CAREER CTA
            =================================================== */}

            <section className="mb-12">

              <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 p-7 md:p-8">

                <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl" />

                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                  <div>
                    <div className="flex items-center gap-3 mb-3">

                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                        <User
                          size={21}
                          className="text-indigo-400"
                        />
                      </div>

                      <h2 className="text-xl font-bold">
                        Keep your profile competitive
                      </h2>

                    </div>

                    <p className="text-[var(--text-secondary)] max-w-2xl">
                      Keep your skills, experience, portfolio, and
                      professional information up to date so clients
                      can better understand what you can offer.
                    </p>
                  </div>

                  <Link
                    to="/profile"
                    className="shrink-0 inline-flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold transition"
                  >
                    <User size={18} />

                    Update Profile

                    <ArrowRight size={17} />
                  </Link>

                </div>

              </div>
            </section>

            {/* ==================================================
                BOTTOM ACTIONS
            =================================================== */}

            <section>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">

                <ActionCard
                  to="/jobs"
                  icon={<Search size={23} />}
                  title="Browse Jobs"
                  description="Explore freelance projects and find opportunities that match your skills."
                  color="text-cyan-400"
                />

                <ActionCard
                  to="/my-applications"
                  icon={<Briefcase size={23} />}
                  title="My Applications"
                  description="Review and track all the applications you've submitted."
                  color="text-indigo-400"
                />

                <ActionCard
                  to="/profile"
                  icon={<User size={23} />}
                  title="My Profile"
                  description="Manage your skills, experience, portfolio, and professional details."
                  color="text-green-400"
                />

                <ActionCard
                  to="/notifications"
                  icon={<Bell size={23} />}
                  title="Notifications"
                  description="Stay informed about application updates and new opportunities."
                  color="text-yellow-400"
                />

              </div>

            </section>
          </>
        )}
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
  iconColor,
  hoverColor,
}) => {
  return (
    <Link
      to={to}
      className={`group bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 ${hoverColor} transition-all duration-200 hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between">

        <div className={iconColor}>
          {icon}
        </div>

        <ArrowRight
          size={18}
          className="text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
        />

      </div>

      <p className="text-[var(--text-secondary)] mt-5">
        {label}
      </p>

      <h3 className="text-4xl font-bold mt-1">
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
   MINI ACTION
============================================================= */

const MiniAction = ({
  to,
  icon,
  title,
  description,
  color,
}) => {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-primary)] transition"
    >

      <div
        className={`w-10 h-10 rounded-lg bg-[var(--bg-primary)] flex items-center justify-center ${color}`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">

        <h3 className="font-semibold">
          {title}
        </h3>

        <p className="text-xs text-[var(--text-secondary)] truncate">
          {description}
        </p>

      </div>

      <ArrowRight
        size={16}
        className="text-[var(--text-secondary)] group-hover:text-cyan-400 group-hover:translate-x-1 transition"
      />

    </Link>
  );
};


/* =============================================================
   STATUS CARD
============================================================= */

const StatusCard = ({
  to,
  icon,
  title,
  value,
  description,
  color,
  border,
}) => {
  return (
    <Link
      to={to}
      className={`group bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 ${border} transition-all duration-200 hover:-translate-y-0.5`}
    >

      <div className="flex items-start justify-between">

        <div className={color}>
          {icon}
        </div>

        <ArrowRight
          size={18}
          className="text-[var(--text-secondary)] group-hover:text-cyan-400 group-hover:translate-x-1 transition"
        />

      </div>

      <p className="text-[var(--text-secondary)] mt-5">
        {title}
      </p>

      <p className="text-3xl font-bold mt-1">
        {value}
      </p>

      <p className="text-sm text-[var(--text-secondary)] mt-2">
        {description}
      </p>

    </Link>
  );
};


/* =============================================================
   ACTION CARD
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
      className="group bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 hover:border-cyan-500 transition-all duration-200 hover:-translate-y-0.5"
    >

      <div
        className={`w-11 h-11 rounded-xl bg-[var(--bg-primary)] flex items-center justify-center ${color} mb-5 group-hover:scale-105 transition-transform`}
      >
        {icon}
      </div>

      <h3 className="font-bold text-lg">
        {title}
      </h3>

      <p className="text-[var(--text-secondary)] mt-2 leading-relaxed text-sm">
        {description}
      </p>

    </Link>
  );
};

export default DeveloperDashboard;
