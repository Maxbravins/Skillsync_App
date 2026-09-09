import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  ArrowRight,
  Eye,
  Edit3,
  CreditCard,
  CircleDollarSign,
} from "lucide-react";

import { getClientDashboard } from "../../services/dashboard.service";
import { getMyJobs } from "../../services/job.service";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const ClientDashboard = () => {
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [error, setError] = useState("");
  const [jobsError, setJobsError] = useState("");

  const fetchDashboard = useCallback(async () => {
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
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      setJobsLoading(true);
      setJobsError("");

      const data = await getMyJobs();

      setJobs(Array.isArray(data?.jobs) ? data.jobs : []);
    } catch (err) {
      console.error("Client Jobs Error:", err);

      setJobsError(
        err?.response?.data?.message ||
          "Unable to load your recent jobs."
      );
    } finally {
      setJobsLoading(false);
    }
  }, []);

  const refreshDashboard = async () => {
    await Promise.all([fetchDashboard(), fetchJobs()]);
  };

  useEffect(() => {
    fetchDashboard();
    fetchJobs();
  }, [fetchDashboard, fetchJobs]);

  /*
   * ------------------------------------------------------------
   * JOB STATISTICS
   * ------------------------------------------------------------
   */

  const jobStats = useMemo(() => {
    const total = jobs.length;

    const open = jobs.filter(
      (job) => job.status === "Open"
    ).length;

    const inProgress = jobs.filter(
      (job) => job.status === "In Progress"
    ).length;

    const completed = jobs.filter(
      (job) => job.status === "Completed"
    ).length;

    const cancelled = jobs.filter(
      (job) => job.status === "Cancelled"
    ).length;

    const unpublished = jobs.filter(
      (job) => !job.isPublished
    ).length;

    const published = jobs.filter(
      (job) => job.isPublished
    ).length;

    const pendingPayment = jobs.filter(
      (job) => !job.isPublished && !job.platformFeePaid
    ).length;

    const totalBudget = jobs.reduce(
      (sum, job) => sum + Number(job.budget || 0),
      0
    );

    return {
      total,
      open,
      inProgress,
      completed,
      cancelled,
      unpublished,
      published,
      pendingPayment,
      totalBudget,
    };
  }, [jobs]);

  /*
   * ------------------------------------------------------------
   * APPLICATION STATISTICS
   * ------------------------------------------------------------
   *
   * These are retained from your existing backend dashboard.
   */

  const totalApplications =
    stats?.totalApplications || 0;

  const pendingApplications =
    stats?.pendingApplications || 0;

  const acceptedApplications =
    stats?.acceptedApplications || 0;

  const rejectedApplications =
    stats?.rejectedApplications || 0;

  /*
   * ------------------------------------------------------------
   * RECENT JOBS
   * ------------------------------------------------------------
   */

  const recentJobs = useMemo(() => {
    return [...jobs]
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
      )
      .slice(0, 5);
  }, [jobs]);

  /*
   * ------------------------------------------------------------
   * STATUS STYLE
   * ------------------------------------------------------------
   */

  const getStatusStyle = (status) => {
    switch (status) {
      case "Open":
        return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";

      case "In Progress":
        return "bg-blue-500/15 text-blue-400 border border-blue-500/30";

      case "Completed":
        return "bg-purple-500/15 text-purple-400 border border-purple-500/30";

      case "Cancelled":
        return "bg-red-500/15 text-red-400 border border-red-500/30";

      default:
        return "bg-slate-500/15 text-slate-400 border border-slate-500/30";
    }
  };

  /*
   * ------------------------------------------------------------
   * LOADING
   * ------------------------------------------------------------
   */

  const initialLoading = loading && jobsLoading && !stats && jobs.length === 0;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <section className="mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            <div>
              <p className="text-cyan-400 font-semibold mb-2">
                Client Workspace
              </p>

              <h1 className="text-4xl md:text-5xl font-bold">
                Client Dashboard
              </h1>

              <p className="mt-3 text-[var(--text-secondary)] max-w-2xl leading-relaxed">
                Manage your projects, monitor hiring activity, and
                keep track of the developers applying to your jobs.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">

              <button
                type="button"
                onClick={refreshDashboard}
                disabled={loading || jobsLoading}
                className="inline-flex items-center justify-center gap-2 border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-cyan-500 px-4 py-3 rounded-xl font-semibold transition disabled:opacity-50"
              >
                <RefreshCw
                  size={18}
                  className={
                    loading || jobsLoading
                      ? "animate-spin"
                      : ""
                  }
                />

                Refresh
              </button>

              <Link
                to="/create-job"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white px-5 py-3 rounded-xl font-semibold hover:opacity-90 transition"
              >
                <Plus size={19} />
                Post a Job
              </Link>

            </div>
          </div>
        </section>

        {/* =====================================================
            ERROR
        ====================================================== */}

        {(error || jobsError) && (
          <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 p-5">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

              <div className="flex items-start gap-3">

                <AlertCircle
                  size={22}
                  className="text-red-400 mt-0.5 shrink-0"
                />

                <div>
                  <p className="font-semibold text-red-400">
                    Dashboard partially unavailable
                  </p>

                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    {error || jobsError}
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={refreshDashboard}
                className="shrink-0 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                Try Again
              </button>

            </div>
          </div>
        )}

        {/* =====================================================
            JOB STATISTICS
        ====================================================== */}

        {initialLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">

            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-40 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] animate-pulse"
              />
            ))}

          </div>
        ) : (
          <section className="mb-12">

            <div className="flex items-center justify-between mb-5">

              <div>
                <h2 className="text-2xl font-bold">
                  Job Overview
                </h2>

                <p className="text-[var(--text-secondary)] mt-1">
                  See the current state of your posted projects.
                </p>
              </div>

              <Briefcase
                size={28}
                className="text-cyan-400 hidden sm:block"
              />

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

              <DashboardCard
                to="/my-jobs"
                label="Total Jobs"
                value={jobStats.total}
                icon={<Briefcase size={32} />}
                color="text-cyan-400"
                hover="hover:border-cyan-500"
              />

              <DashboardCard
                to="/my-jobs"
                label="Open Jobs"
                value={jobStats.open}
                icon={<Clock3 size={32} />}
                color="text-emerald-400"
                hover="hover:border-emerald-500"
              />

              <DashboardCard
                to="/my-jobs"
                label="In Progress"
                value={jobStats.inProgress}
                icon={<RefreshCw size={32} />}
                color="text-blue-400"
                hover="hover:border-blue-500"
              />

              <DashboardCard
                to="/my-jobs"
                label="Completed"
                value={jobStats.completed}
                icon={<CheckCircle size={32} />}
                color="text-purple-400"
                hover="hover:border-purple-500"
              />

            </div>
          </section>
        )}

        {/* =====================================================
            HIRING ACTIVITY
        ====================================================== */}

        <section className="mb-12">

          <div className="flex items-center justify-between mb-5">

            <div>
              <h2 className="text-2xl font-bold">
                Hiring Activity
              </h2>

              <p className="text-[var(--text-secondary)] mt-1">
                Monitor developer applications across your jobs.
              </p>
            </div>

            <Users
              size={28}
              className="text-indigo-400 hidden sm:block"
            />

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

            <DashboardCard
              to="/applications"
              label="Applications"
              value={totalApplications}
              icon={<Users size={32} />}
              color="text-cyan-400"
              hover="hover:border-cyan-500"
            />

            <DashboardCard
              to="/applications?status=pending"
              label="Pending Review"
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

        {/* =====================================================
            ACTION / PAYMENT ALERT
        ====================================================== */}

        {jobStats.pendingPayment > 0 && (
          <section className="mb-12">

            <div className="relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                <div className="flex items-start gap-4">

                  <div className="w-11 h-11 shrink-0 rounded-xl bg-yellow-500/15 flex items-center justify-center">
                    <CreditCard
                      size={23}
                      className="text-yellow-400"
                    />
                  </div>

                  <div>
                    <h2 className="font-bold text-lg">
                      {jobStats.pendingPayment}{" "}
                      {jobStats.pendingPayment === 1
                        ? "job needs"
                        : "jobs need"}{" "}
                      platform payment
                    </h2>

                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      Complete the platform fee payment before
                      publishing these job listings.
                    </p>
                  </div>

                </div>

                <Link
                  to="/my-jobs"
                  className="shrink-0 inline-flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black px-5 py-3 rounded-xl font-semibold transition"
                >
                  Review Jobs
                  <ArrowRight size={18} />
                </Link>

              </div>

            </div>
          </section>
        )}

        {/* =====================================================
            RECENT JOBS
        ====================================================== */}

        <section className="mb-12">

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">

            <div>
              <h2 className="text-2xl font-bold">
                Recent Jobs
              </h2>

              <p className="text-[var(--text-secondary)] mt-1">
                Your latest job listings and their current status.
              </p>
            </div>

            <Link
              to="/my-jobs"
              className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1"
            >
              View all jobs
              <ArrowRight size={17} />
            </Link>

          </div>

          {jobsLoading ? (
            <div className="space-y-4">

              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-28 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] animate-pulse"
                />
              ))}

            </div>
          ) : recentJobs.length === 0 ? (
            <EmptyJobs />
          ) : (
            <div className="space-y-4">

              {recentJobs.map((job) => (
                <RecentJobCard
                  key={job._id}
                  job={job}
                  getStatusStyle={getStatusStyle}
                />
              ))}

            </div>
          )}

        </section>

        {/* =====================================================
            APPLICATION OVERVIEW
        ====================================================== */}

        {totalApplications > 0 && (
          <section className="mb-12">

            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 md:p-8">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">

                <div>
                  <h2 className="text-2xl font-bold">
                    Application Overview
                  </h2>

                  <p className="text-[var(--text-secondary)] mt-1">
                    See how developers are responding to your jobs.
                  </p>
                </div>

                <Link
                  to="/applications"
                  className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1"
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

            </div>
          </section>
        )}

        {/* =====================================================
            QUICK ACTIONS
        ====================================================== */}

        <section className="mb-12">

          <div className="mb-5">

            <h2 className="text-2xl font-bold">
              Quick Actions
            </h2>

            <p className="text-[var(--text-secondary)] mt-1">
              Manage your hiring workflow from one place.
            </p>

          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">

            <ActionCard
              to="/create-job"
              icon={<Plus size={24} />}
              title="Post a Job"
              description="Create a new opportunity and start receiving applications."
              color="text-cyan-400"
            />

            <ActionCard
              to="/my-jobs"
              icon={<Briefcase size={24} />}
              title="My Jobs"
              description="View, edit, publish, and manage your job listings."
              color="text-indigo-400"
            />

            <ActionCard
              to="/applications"
              icon={<Users size={24} />}
              title="Review Applicants"
              description="Review developers who have applied to your projects."
              color="text-green-400"
            />

            <ActionCard
              to="/profile"
              icon={<User size={24} />}
              title="Company Profile"
              description="Keep your client and company information up to date."
              color="text-yellow-400"
            />

          </div>

        </section>

        {/* =====================================================
            FINAL CTA
        ====================================================== */}

        <section>

          <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-purple-500/10 p-8">

            <div className="absolute -right-16 -top-16 w-40 h-40 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="absolute -left-16 -bottom-16 w-40 h-40 rounded-full bg-indigo-500/10 blur-3xl" />

            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">

              <div>

                <div className="flex items-center gap-3 mb-3">

                  <CircleDollarSign
                    className="text-cyan-400"
                    size={25}
                  />

                  <h2 className="text-xl font-bold">
                    Ready to hire?
                  </h2>

                </div>

                <p className="text-[var(--text-secondary)] max-w-2xl">
                  Post your next project and let skilled developers
                  apply for the opportunity.
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
   RECENT JOB CARD
============================================================= */

const RecentJobCard = ({
  job,
  getStatusStyle,
}) => {
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-5 hover:border-cyan-500/50 transition">

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

        <div className="min-w-0 flex-1">

          <div className="flex flex-wrap items-center gap-2 mb-2">

            <h3 className="text-lg font-bold truncate">
              {job.title}
            </h3>

            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
                job.status
              )}`}
            >
              {job.status || "Open"}
            </span>

            {!job.isPublished && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
                Unpublished
              </span>
            )}

          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--text-secondary)]">

            <span>
              Budget:{" "}
              <strong className="text-[var(--text-primary)]">
                KES {Number(job.budget || 0).toLocaleString()}
              </strong>
            </span>

            {job.category?.name && (
              <span>
                {job.category.name}
              </span>
            )}

            <span>
              {job.createdAt
                ? new Date(job.createdAt).toLocaleDateString()
                : "N/A"}
            </span>

          </div>

        </div>

        <div className="flex flex-wrap gap-2">

          <Link
            to={`/jobs/${job._id}`}
            className="inline-flex items-center justify-center gap-2 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            <Eye size={16} />
            View
          </Link>

          <Link
            to={`/job-applicants/${job._id}`}
            className="inline-flex items-center justify-center gap-2 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            <Users size={16} />
            Applicants
          </Link>

          <Link
            to={`/edit-job/${job._id}`}
            className="inline-flex items-center justify-center gap-2 border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            <Edit3 size={16} />
            Edit
          </Link>

        </div>

      </div>
    </div>
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
    total > 0
      ? Math.round((value / total) * 100)
      : 0;

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
          style={{
            width: `${percentage}%`,
          }}
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

/* =============================================================
   EMPTY JOB STATE
============================================================= */

const EmptyJobs = () => {
  return (
    <div className="text-center py-14 px-6 bg-[var(--bg-secondary)] rounded-2xl border border-dashed border-[var(--border-color)]">

      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
        <Briefcase
          size={28}
          className="text-cyan-400"
        />
      </div>

      <h3 className="text-xl font-bold mb-2">
        No jobs posted yet
      </h3>

      <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-6">
        Create your first job and start connecting with
        skilled developers.
      </p>

      <Link
        to="/create-job"
        className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 px-6 rounded-lg transition"
      >
        <Plus size={18} />
        Post Your First Job
      </Link>

    </div>
  );
};

export default ClientDashboard;
