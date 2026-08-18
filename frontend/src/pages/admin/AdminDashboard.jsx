import { useState, useEffect } from "react";
import {
  FaUsers,
  FaBriefcase,
  FaFileAlt,
  FaMoneyBillWave,
  FaStar,
  FaCreditCard,
  FaChartLine,
  FaUserTie,
  FaUserShield,
  FaTrash,
  FaFilePdf,
  FaExternalLinkAlt,
} from "react-icons/fa";

import api from "../../services/api";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);

  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [statsRes, usersRes, jobsRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/admin/jobs"),
      ]);

      setStats(statsRes.data.stats || {});
      setUsers(usersRes.data.users || []);
      setJobs(jobsRes.data.jobs || []);
    } catch (error) {
      console.error("Admin dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const deleteUser = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this user?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/admin/users/${id}`);

      setUsers((prev) => prev.filter((user) => user._id !== id));

      alert("User deleted successfully.");
    } catch (error) {
      console.error("Delete user error:", error);

      alert(
        error.response?.data?.message ||
          "Failed to delete user."
      );
    }
  };

  const deleteJob = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this job?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/admin/jobs/${id}`);

      setJobs((prev) => prev.filter((job) => job._id !== id));

      alert("Job deleted successfully.");
    } catch (error) {
      console.error("Delete job error:", error);

      alert(
        error.response?.data?.message ||
          "Failed to delete job."
      );
    }
  };

  const exportApplicationsPDF = () => {
    window.open(
      "http://localhost:5000/api/applications/export/pdf",
      "_blank"
    );
  };

  const formatMoney = (amount) => {
    return `KES ${(Number(amount) || 0).toLocaleString()}`;
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-500/20 text-red-400";

      case "client":
        return "bg-blue-500/20 text-blue-400";

      case "developer":
        return "bg-purple-500/20 text-purple-400";

      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getJobStatus = (job) => {
    if (job.isPublished) {
      return {
        text: "Published",
        className: "bg-green-500/20 text-green-400",
      };
    }

    return {
      text: job.status || "Pending",
      className: "bg-yellow-500/20 text-yellow-400",
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <Navbar />

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">⚙️</div>

            <p className="text-xl text-[var(--text-secondary)]">
              Loading Admin Dashboard...
            </p>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">

        {/* HEADER */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div>
            <h1 className="text-3xl font-bold">
              Admin Dashboard
            </h1>

            <p className="text-[var(--text-secondary)] mt-1">
              Monitor and manage the SkillSync platform.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            <button
              onClick={exportApplicationsPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition"
            >
              <FaFilePdf />
              Export Applications
            </button>

            <button
              onClick={() =>
                (window.location.href = "/admin/reports")
              }
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition"
            >
              <FaChartLine />
              View Reports
            </button>

          </div>
        </div>


        {/* =====================================================
            PRIMARY STATISTICS
        ====================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">

          {/* USERS */}

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Total Users
                </p>

                <p className="text-3xl font-bold mt-1">
                  {stats?.totalUsers || 0}
                </p>

                <p className="text-xs text-[var(--text-secondary)] mt-2">
                  {stats?.totalClients || 0} clients ·{" "}
                  {stats?.totalDevelopers || 0} developers
                </p>
              </div>

              <FaUsers className="text-cyan-400 text-3xl" />

            </div>

          </div>


          {/* JOBS */}

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Total Jobs
                </p>

                <p className="text-3xl font-bold mt-1">
                  {stats?.totalJobs || 0}
                </p>

                <p className="text-xs text-[var(--text-secondary)] mt-2">
                  {stats?.activeJobs ??
                    stats?.publishedJobs ??
                    0}{" "}
                  published
                </p>
              </div>

              <FaBriefcase className="text-purple-400 text-3xl" />

            </div>

          </div>


          {/* APPLICATIONS */}

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Applications
                </p>

                <p className="text-3xl font-bold mt-1">
                  {stats?.totalApplications || 0}
                </p>

                <p className="text-xs text-[var(--text-secondary)] mt-2">
                  Total submitted
                </p>
              </div>

              <FaFileAlt className="text-green-400 text-3xl" />

            </div>

          </div>


          {/* REVENUE */}

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-[var(--text-secondary)]">
                  SkillSync Revenue
                </p>

                <p className="text-2xl font-bold mt-1">
                  {formatMoney(stats?.totalRevenue)}
                </p>

                <p className="text-xs text-[var(--text-secondary)] mt-2">
                  Platform earnings
                </p>
              </div>

              <FaMoneyBillWave className="text-yellow-400 text-3xl" />

            </div>

          </div>

        </div>


        {/*  PREMIUM / PAYMENT STATISTICS */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

          {/* PREMIUM USERS */}

          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-6">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-yellow-400">
                  Premium Users
                </p>

                <p className="text-3xl font-bold mt-1">
                  {stats?.premiumUsers || 0}
                </p>

                <p className="text-xs text-[var(--text-secondary)] mt-2">
                  Active subscriptions
                </p>
              </div>

              <FaStar className="text-yellow-400 text-3xl" />

            </div>

          </div>


          {/* PREMIUM REVENUE */}

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Premium Revenue
                </p>

                <p className="text-2xl font-bold mt-1">
                  {formatMoney(stats?.premiumRevenue)}
                </p>

                <p className="text-xs text-[var(--text-secondary)] mt-2">
                  Premium subscriptions
                </p>
              </div>

              <FaStar className="text-yellow-400 text-3xl" />

            </div>

          </div>


          {/* COMPLETED PAYMENTS */}

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Completed Payments
                </p>

                <p className="text-3xl font-bold mt-1">
                  {stats?.completedTransactions || 0}
                </p>

                <p className="text-xs text-[var(--text-secondary)] mt-2">
                  Successful transactions
                </p>
              </div>

              <FaCreditCard className="text-green-400 text-3xl" />

            </div>

          </div>


          {/* PROCESSED */}

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Total Processed
                </p>

                <p className="text-2xl font-bold mt-1">
                  {formatMoney(stats?.totalProcessed)}
                </p>

                <p className="text-xs text-[var(--text-secondary)] mt-2">
                  Money processed
                </p>
              </div>

              <FaChartLine className="text-cyan-400 text-3xl" />

            </div>

          </div>

        </div>

        {/* TRANSACTION SUMMARY */}

        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 mb-8">

          <div className="flex items-center justify-between mb-5">

            <h2 className="text-xl font-semibold">
              Transaction Overview
            </h2>

            <FaCreditCard className="text-cyan-400" />

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
              <p className="text-sm text-green-400">
                Completed
              </p>

              <p className="text-2xl font-bold mt-1">
                {stats?.completedTransactions || 0}
              </p>
            </div>

            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4">
              <p className="text-sm text-yellow-400">
                Pending
              </p>

              <p className="text-2xl font-bold mt-1">
                {stats?.pendingTransactions || 0}
              </p>
            </div>

            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
              <p className="text-sm text-red-400">
                Failed
              </p>

              <p className="text-2xl font-bold mt-1">
                {stats?.failedTransactions || 0}
              </p>
            </div>

          </div>

        </div>


        {/*  TABS */}

        <div className="flex gap-2 mb-6 border-b border-[var(--border-color)]">

          <button
            onClick={() => setActiveTab("users")}
            className={`px-5 py-3 font-semibold transition border-b-2 ${
              activeTab === "users"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-[var(--text-secondary)]"
            }`}
          >
            Users ({users.length})
          </button>

          <button
            onClick={() => setActiveTab("jobs")}
            className={`px-5 py-3 font-semibold transition border-b-2 ${
              activeTab === "jobs"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-[var(--text-secondary)]"
            }`}
          >
            Jobs ({jobs.length})
          </button>

        </div>

        {/* USERS */}

        {activeTab === "users" && (

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl overflow-hidden">

            <div className="p-5 border-b border-[var(--border-color)]">

              <h2 className="text-xl font-semibold">
                User Management
              </h2>

              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Manage SkillSync accounts.
              </p>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-[var(--bg-primary)]">

                  <tr>

                    <th className="px-4 py-3 text-left">
                      User
                    </th>

                    <th className="px-4 py-3 text-left">
                      Email
                    </th>

                    <th className="px-4 py-3 text-left">
                      Role
                    </th>

                    <th className="px-4 py-3 text-left">
                      Premium
                    </th>

                    <th className="px-4 py-3 text-left">
                      Joined
                    </th>

                    <th className="px-4 py-3 text-right">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {users.length > 0 ? (

                    users.map((user) => {

                      const premiumActive =
                        user.isPremium &&
                        user.premiumExpiresAt &&
                        new Date(user.premiumExpiresAt) >
                          new Date();

                      return (

                        <tr
                          key={user._id}
                          className="border-t border-[var(--border-color)] hover:bg-[var(--bg-primary)]"
                        >

                          <td className="px-4 py-4">

                            <div className="flex items-center gap-3">

                              {user.profilePicture ? (

                                <img
                                  src={user.profilePicture}
                                  alt={user.username}
                                  className="w-9 h-9 rounded-full object-cover"
                                />

                              ) : (

                                <div className="w-9 h-9 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                                  <FaUsers />
                                </div>

                              )}

                              <div>

                                <p className="font-semibold">
                                  {user.username}
                                </p>

                                {user.company && (
                                  <p className="text-xs text-[var(--text-secondary)]">
                                    {user.company}
                                  </p>
                                )}

                              </div>

                            </div>

                          </td>

                          <td className="px-4 py-4 text-sm">
                            {user.email}
                          </td>

                          <td className="px-4 py-4">

                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleBadge(
                                user.role
                              )}`}
                            >
                              {user.role}
                            </span>

                          </td>

                          <td className="px-4 py-4">

                            {premiumActive ? (

                              <div>

                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400">
                                  <FaStar />
                                  Premium
                                </span>

                                <p className="text-xs text-[var(--text-secondary)] mt-1">
                                  {user.premiumPlan || "premium"}
                                </p>

                              </div>

                            ) : (

                              <span className="text-xs text-[var(--text-secondary)]">
                                Free
                              </span>

                            )}

                          </td>

                          <td className="px-4 py-4 text-sm">
                            {user.createdAt
                              ? new Date(
                                  user.createdAt
                                ).toLocaleDateString()
                              : "—"}
                          </td>

                          <td className="px-4 py-4 text-right">

                            {user.role !== "admin" && (

                              <button
                                onClick={() =>
                                  deleteUser(user._id)
                                }
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition"
                              >
                                <FaTrash />
                                Delete
                              </button>

                            )}

                          </td>

                        </tr>

                      );

                    })

                  ) : (

                    <tr>

                      <td
                        colSpan="6"
                        className="px-6 py-10 text-center text-[var(--text-secondary)]"
                      >
                        No users found.
                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

          </div>

        )}

        {/*  JOBS */}

        {activeTab === "jobs" && (

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl overflow-hidden">

            <div className="p-5 border-b border-[var(--border-color)]">

              <h2 className="text-xl font-semibold">
                Job Management
              </h2>

              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Monitor projects posted on SkillSync.
              </p>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-[var(--bg-primary)]">

                  <tr>

                    <th className="px-4 py-3 text-left">
                      Job
                    </th>

                    <th className="px-4 py-3 text-left">
                      Client
                    </th>

                    <th className="px-4 py-3 text-left">
                      Budget
                    </th>

                    <th className="px-4 py-3 text-left">
                      Payment
                    </th>

                    <th className="px-4 py-3 text-left">
                      Status
                    </th>

                    <th className="px-4 py-3 text-left">
                      Date
                    </th>

                    <th className="px-4 py-3 text-right">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {jobs.length > 0 ? (

                    jobs.map((job) => {

                      const status = getJobStatus(job);

                      return (

                        <tr
                          key={job._id}
                          className="border-t border-[var(--border-color)] hover:bg-[var(--bg-primary)]"
                        >

                          <td className="px-4 py-4">

                            <div>

                              <p className="font-semibold">
                                {job.title}
                              </p>

                              <p className="text-xs text-[var(--text-secondary)]">
                                {job.projectType || "Project"}
                              </p>

                            </div>

                          </td>

                          <td className="px-4 py-4">

                            <p className="font-medium">
                              {job.client?.username ||
                                "Unknown"}
                            </p>

                            <p className="text-xs text-[var(--text-secondary)]">
                              {job.client?.email || ""}
                            </p>

                          </td>

                          <td className="px-4 py-4 font-semibold">
                            {formatMoney(job.budget)}
                          </td>

                          <td className="px-4 py-4">

                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                job.paymentStatus === "paid"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                              }`}
                            >
                              {job.paymentStatus || "pending"}
                            </span>

                          </td>

                          <td className="px-4 py-4">

                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${status.className}`}
                            >
                              {status.text}
                            </span>

                          </td>

                          <td className="px-4 py-4 text-sm">
                            {job.createdAt
                              ? new Date(
                                  job.createdAt
                                ).toLocaleDateString()
                              : "—"}
                          </td>

                          <td className="px-4 py-4 text-right">

                            <button
                              onClick={() =>
                                deleteJob(job._id)
                              }
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition"
                            >
                              <FaTrash />
                              Delete
                            </button>

                          </td>

                        </tr>

                      );

                    })

                  ) : (

                    <tr>

                      <td
                        colSpan="7"
                        className="px-6 py-10 text-center text-[var(--text-secondary)]"
                      >
                        No jobs found.
                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

          </div>

        )}

      </main>

      <Footer />

    </div>
  );
};
export default AdminDashboard;