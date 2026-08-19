import { useState, useEffect, useMemo } from "react";
import {
  FaUsers,
  FaBriefcase,
  FaFileAlt,
  FaMoneyBillWave,
  FaStar,
  FaCreditCard,
  FaChartLine,
  FaTrash,
  FaFilePdf,
  FaSyncAlt,
  FaSearch,
  FaCrown,
} from "react-icons/fa";

import api from "../../services/api";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [activeTab, setActiveTab] = useState("users");
  const [transactionFilter, setTransactionFilter] = useState("all");
  const [transactionSearch, setTransactionSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [statsRes, usersRes, jobsRes, transactionsRes] =
        await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/users"),
          api.get("/admin/jobs"),
          api.get("/admin/transactions"),
        ]);

      setStats(statsRes.data.stats || {});
      setUsers(usersRes.data.users || []);
      setJobs(jobsRes.data.jobs || []);
      setTransactions(transactionsRes.data.transactions || []);
    } catch (error) {
      console.error("Admin dashboard error:", error);

      alert(
        error.response?.data?.message ||
          "Failed to load admin dashboard data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // DELETE USER
  const deleteUser = async (id) => {
    const user = users.find((item) => item._id === id);

    const confirmed = window.confirm(
      `Delete ${user?.username || "this user"}?\n\nThis action cannot be undone.`
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

  // DELETE JOB
  const deleteJob = async (id) => {
    const job = jobs.find((item) => item._id === id);

    const confirmed = window.confirm(
      `Delete "${job?.title || "this job"}"?\n\nThis action cannot be undone.`
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

  // EXPORT APPLICATIONS
  const exportApplicationsPDF = async () => {
    try {
      const response = await api.get(
        "/applications/export/pdf",
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data])
      );

      const link = document.createElement("a");

      link.href = url;
      link.download = "skillsync-applications.pdf";

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF export error:", error);

      alert(
        error.response?.data?.message ||
          "Failed to export applications."
      );
    }
  };

  // FORMATTING
  const formatMoney = (amount) => {
    return `KES ${(Number(amount) || 0).toLocaleString()}`;
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString();
  };

  // ROLE BADGE
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

  // JOB STATUS
  const getJobStatus = (job) => {
    if (job.isPublished) {
      return {
        text: "Published",
        className:
          "bg-green-500/20 text-green-400",
      };
    }

    return {
      text: job.status || "Pending",
      className:
        "bg-yellow-500/20 text-yellow-400",
    };
  };

    // TRANSACTION STATUS
  const getTransactionStatus = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400";

      case "failed":
        return "bg-red-500/20 text-red-400";

      case "cancelled":
        return "bg-gray-500/20 text-gray-400";

      default:
        return "bg-yellow-500/20 text-yellow-400";
    }
  };

    // SEARCH USERS
  const filteredUsers = useMemo(() => {
    const search = userSearch.toLowerCase().trim();

    if (!search) return users;

    return users.filter(
      (user) =>
        user.username?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search) ||
        user.role?.toLowerCase().includes(search)
    );
  }, [users, userSearch]);

      // SEARCH JOBS
  const filteredJobs = useMemo(() => {
    const search = jobSearch.toLowerCase().trim();

    if (!search) return jobs;

    return jobs.filter(
      (job) =>
        job.title?.toLowerCase().includes(search) ||
        job.client?.username
          ?.toLowerCase()
          .includes(search) ||
        job.client?.email
          ?.toLowerCase()
          .includes(search)
    );
  }, [jobs, jobSearch]);
      // SEARCH TRANSACTIONS
const filteredTransactions = transactions.filter((tx) => {
  const search = transactionSearch.toLowerCase().trim();

  const matchesSearch =
    !search ||
    tx.paymentType?.toLowerCase().includes(search) ||
    tx.status?.toLowerCase().includes(search) ||
    tx.client?.username?.toLowerCase().includes(search) ||
    tx.developer?.username?.toLowerCase().includes(search) ||
    tx.user?.username?.toLowerCase().includes(search) ||
    tx.job?.title?.toLowerCase().includes(search) ||
    tx.mpesaReceiptNumber?.toLowerCase().includes(search);

  const matchesFilter =
    transactionFilter === "all" ||
    tx.status === transactionFilter ||
    tx.paymentType === transactionFilter;

  return matchesSearch && matchesFilter;
});

      // LOADING
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <Navbar />

        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4 animate-pulse">
              ⚙️
            </div>

            <p className="text-xl text-[var(--text-secondary)]">
              Loading Admin Dashboard...
            </p>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">

        {/*  HEADER */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">
                Admin Dashboard
              </h1>

              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400">
                ADMIN
              </span>
            </div>

            <p className="text-[var(--text-secondary)] mt-2">
              Monitor and manage the SkillSync platform.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition disabled:opacity-50"
            >
              <FaSyncAlt
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <button
              onClick={exportApplicationsPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition"
            >
              <FaFilePdf />
              Export Applications
            </button>

            <button
              onClick={() =>
                (window.location.href =
                  "/admin/reports")
              }
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition"
            >
              <FaChartLine />
              Reports
            </button>

          </div>
        </div>

        {/*  PRIMARY STATISTICS */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">

          <StatCard
            icon={<FaUsers />}
            iconClass="text-cyan-400"
            title="Total Users"
            value={stats?.totalUsers}
            description={`${stats?.totalClients || 0} clients · ${
              stats?.totalDevelopers || 0
            } developers`}
          />

          <StatCard
            icon={<FaBriefcase />}
            iconClass="text-purple-400"
            title="Total Jobs"
            value={stats?.totalJobs}
            description={`${stats?.publishedJobs || 0} published`}
          />

          <StatCard
            icon={<FaFileAlt />}
            iconClass="text-green-400"
            title="Applications"
            value={stats?.totalApplications}
            description="Total submitted"
          />

          <StatCard
            icon={<FaMoneyBillWave />}
            iconClass="text-yellow-400"
            title="SkillSync Revenue"
            value={formatMoney(stats?.totalRevenue)}
            description="Platform earnings"
          />

        </div>

        {/*  PREMIUM / PAYMENT STATISTICS */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

          <StatCard
            icon={<FaCrown />}
            iconClass="text-yellow-400"
            title="Premium Users"
            value={stats?.premiumUsers}
            description="Active subscriptions"
            highlight
          />

          <StatCard
            icon={<FaStar />}
            iconClass="text-yellow-400"
            title="Premium Revenue"
            value={formatMoney(stats?.premiumRevenue)}
            description="Premium subscriptions"
          />

          <StatCard
            icon={<FaCreditCard />}
            iconClass="text-green-400"
            title="Completed Payments"
            value={stats?.completedTransactions}
            description="Successful transactions"
          />

          <StatCard
            icon={<FaChartLine />}
            iconClass="text-cyan-400"
            title="Total Processed"
            value={formatMoney(stats?.totalProcessed)}
            description="Money processed"
          />

        </div>

        {/* REVENUE BREAKDOWN */}

        <section className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 mb-8">

          <div className="flex items-center justify-between mb-6">

            <div>
              <h2 className="text-xl font-semibold">
                Revenue Overview
              </h2>

              <p className="text-sm text-[var(--text-secondary)] mt-1">
                How SkillSync generates revenue.
              </p>
            </div>

            <FaChartLine className="text-cyan-400 text-xl" />

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <RevenueBox
              title="Premium Revenue"
              amount={stats?.premiumRevenue}
              color="yellow"
            />

            <RevenueBox
              title="Platform Fees"
              amount={stats?.platformFeeRevenue}
              color="purple"
            />

            <RevenueBox
              title="Total SkillSync Revenue"
              amount={stats?.totalRevenue}
              color="green"
            />

          </div>

        </section>

        {/*  TRANSACTION OVERVIEW */}

        <section className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 mb-8">

          <div className="flex items-center justify-between mb-5">

            <div>
              <h2 className="text-xl font-semibold">
                Transaction Overview
              </h2>

              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Current M-Pesa transaction status.
              </p>
            </div>

            <FaCreditCard className="text-cyan-400" />

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <TransactionBox
              title="Completed"
              value={stats?.completedTransactions}
              className="text-green-400 bg-green-500/10 border-green-500/20"
            />

            <TransactionBox
              title="Pending"
              value={stats?.pendingTransactions}
              className="text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
            />

            <TransactionBox
              title="Failed"
              value={stats?.failedTransactions}
              className="text-red-400 bg-red-500/10 border-red-500/20"
            />

          </div>

        </section>

        {/*  TABS */}

        <div className="flex flex-wrap gap-2 mb-6 border-b border-[var(--border-color)]">

          <TabButton
            active={activeTab === "users"}
            onClick={() => setActiveTab("users")}
          >
            <FaUsers />
            Users ({users.length})
          </TabButton>

          <TabButton
            active={activeTab === "jobs"}
            onClick={() => setActiveTab("jobs")}
          >
            <FaBriefcase />
            Jobs ({jobs.length})
          </TabButton>

          <TabButton
            active={activeTab === "transactions"}
            onClick={() =>
              setActiveTab("transactions")
            }
          >
            <FaCreditCard />
            Transactions ({transactions.length})
          </TabButton>

        </div>

        {/* USERS TAB */}

        {activeTab === "users" && (
          <section className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl overflow-hidden">

            <div className="p-5 border-b border-[var(--border-color)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              <div>
                <h2 className="text-xl font-semibold">
                  User Management
                </h2>

                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Manage SkillSync accounts.
                </p>
              </div>

              <SearchInput
                value={userSearch}
                onChange={setUserSearch}
                placeholder="Search users..."
              />

            </div>

            <div className="overflow-x-auto">

              <table className="w-full min-w-[850px]">

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

                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => {

                      const premiumActive =
                        user.isPremium &&
                        user.premiumExpiresAt &&
                        new Date(
                          user.premiumExpiresAt
                        ) > new Date();

                      return (
                        <tr
                          key={user._id}
                          className="border-t border-[var(--border-color)] hover:bg-[var(--bg-primary)] transition"
                        >

                          <td className="px-4 py-4">

                            <div className="flex items-center gap-3">

                              {user.profilePicture ? (
                                <img
                                  src={
                                    user.profilePicture
                                  }
                                  alt={user.username}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
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
                                  {user.premiumPlan ||
                                    "premium"}
                                </p>

                                <p className="text-xs text-[var(--text-secondary)]">
                                  Until{" "}
                                  {formatDate(
                                    user.premiumExpiresAt
                                  )}
                                </p>

                              </div>
                            ) : (
                              <span className="text-xs text-[var(--text-secondary)]">
                                Free
                              </span>
                            )}

                          </td>

                          <td className="px-4 py-4 text-sm">
                            {formatDate(
                              user.createdAt
                            )}
                          </td>

                          <td className="px-4 py-4 text-right">

                            {user.role !== "admin" && (
                              <button
                                onClick={() =>
                                  deleteUser(
                                    user._id
                                  )
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

          </section>
        )}

        {/* JOBS TAB */}

        {activeTab === "jobs" && (
          <section className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl overflow-hidden">

            <div className="p-5 border-b border-[var(--border-color)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              <div>
                <h2 className="text-xl font-semibold">
                  Job Management
                </h2>

                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Monitor projects posted on SkillSync.
                </p>
              </div>

              <SearchInput
                value={jobSearch}
                onChange={setJobSearch}
                placeholder="Search jobs..."
              />

            </div>

            <div className="overflow-x-auto">

              <table className="w-full min-w-[950px]">

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

                  {filteredJobs.length > 0 ? (
                    filteredJobs.map((job) => {

                      const status =
                        getJobStatus(job);

                      return (
                        <tr
                          key={job._id}
                          className="border-t border-[var(--border-color)] hover:bg-[var(--bg-primary)] transition"
                        >

                          <td className="px-4 py-4">
                            <p className="font-semibold">
                              {job.title}
                            </p>

                            <p className="text-xs text-[var(--text-secondary)]">
                              {job.projectType ||
                                "Project"}
                            </p>
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
                                job.platformFeePaid
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                              }`}
                            >
                              {job.platformFeePaid
                                ? "Paid"
                                : "Pending"}
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
                            {formatDate(
                              job.createdAt
                            )}
                          </td>

                          <td className="px-4 py-4 text-right">

                            <button
                              onClick={() =>
                                deleteJob(
                                  job._id
                                )
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

          </section>
        )}

         {/* TRANSACTIONS TAB */}

          {activeTab === "transactions" && (
            <section className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl overflow-hidden">

              <div className="p-5 border-b border-[var(--border-color)]">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                  <div>
                    <h2 className="text-xl font-semibold">
                      Transaction Management
                    </h2>

                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      Monitor payments processed through SkillSync.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">

                    <input
                      type="text"
                      value={transactionSearch}
                      onChange={(e) =>
                        setTransactionSearch(e.target.value)
                      }
                      placeholder="Search transactions..."
                      className="px-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] outline-none focus:ring-2 focus:ring-cyan-400"
                    />

                    <select
                      value={transactionFilter}
                      onChange={(e) =>
                        setTransactionFilter(e.target.value)
                      }
                      className="px-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] outline-none"
                    >
                      <option value="all">
                        All Transactions
                      </option>

                      <option value="completed">
                        Completed
                      </option>

                      <option value="pending">
                        Pending
                      </option>

                      <option value="failed">
                        Failed
                      </option>

                      <option value="premium">
                        Premium
                      </option>

                      <option value="platform_fee">
                        Platform Fee
                      </option>

                      <option value="project_payment">
                        Project Payment
                      </option>
                    </select>

                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">

                <table className="w-full min-w-[1100px]">

                  <thead className="bg-[var(--bg-primary)]">

                    <tr>

                      <th className="px-4 py-3 text-left">
                        Type
                      </th>

                      <th className="px-4 py-3 text-left">
                        User
                      </th>

                      <th className="px-4 py-3 text-left">
                        Job
                      </th>

                      <th className="px-4 py-3 text-left">
                        Amount
                      </th>

                      <th className="px-4 py-3 text-left">
                        Status
                      </th>

                      <th className="px-4 py-3 text-left">
                        Receipt
                      </th>

                      <th className="px-4 py-3 text-left">
                        Date
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredTransactions.length > 0 ? (

                      filteredTransactions.map((tx) => {

                        const user =
                          tx.user ||
                          tx.client ||
                          tx.developer;

                        return (
                          <tr
                            key={tx._id}
                            className="border-t border-[var(--border-color)] hover:bg-[var(--bg-primary)] transition"
                          >

                            <td className="px-4 py-4">

                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400">
                                {tx.paymentType
                                  ?.replace("_", " ")
                                  .replace(/\b\w/g, (c) =>
                                    c.toUpperCase()
                                  ) || "Unknown"}
                              </span>

                            </td>

                            <td className="px-4 py-4">

                              <p className="font-semibold">
                                {user?.username || "Unknown"}
                              </p>

                              <p className="text-xs text-[var(--text-secondary)]">
                                {user?.email || ""}
                              </p>

                            </td>

                            <td className="px-4 py-4">

                              {tx.job?.title || "—"}

                            </td>

                            <td className="px-4 py-4 font-semibold">

                              {formatMoney(tx.amount)}

                            </td>

                            <td className="px-4 py-4">

                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  tx.status === "completed"
                                    ? "bg-green-500/20 text-green-400"
                                    : tx.status === "failed"
                                    ? "bg-red-500/20 text-red-400"
                                    : tx.status === "cancelled"
                                    ? "bg-gray-500/20 text-gray-400"
                                    : "bg-yellow-500/20 text-yellow-400"
                                }`}
                              >
                                {tx.status}
                              </span>

                            </td>

                            <td className="px-4 py-4 font-mono text-sm">

                              {tx.mpesaReceiptNumber || "—"}

                            </td>

                            <td className="px-4 py-4 text-sm">

                              {tx.createdAt
                                ? new Date(
                                    tx.createdAt
                                  ).toLocaleDateString()
                                : "—"}

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
                          No transactions found.
                        </td>

                      </tr>

                    )}

                  </tbody>

                </table>

              </div>

            </section>
          )}
            </main>

                <Footer />
              </div>
            );
          };

    // STAT CARD
const StatCard = ({
  icon,
  iconClass,
  title,
  value,
  description,
  highlight = false,
}) => {
  return (
    <div
      className={`rounded-xl p-6 border ${
        highlight
          ? "bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30"
          : "bg-[var(--bg-secondary)] border-[var(--border-color)]"
      }`}
    >
      <div className="flex items-center justify-between gap-4">

        <div>
          <p className="text-sm text-[var(--text-secondary)]">
            {title}
          </p>

          <p className="text-2xl sm:text-3xl font-bold mt-1">
            {value ?? 0}
          </p>

          <p className="text-xs text-[var(--text-secondary)] mt-2">
            {description}
          </p>
        </div>

        <div className={`text-3xl ${iconClass}`}>
          {icon}
        </div>

      </div>
    </div>
  );
};

    // REVENUE BOX
const RevenueBox = ({
  title,
  amount,
  color,
}) => {
  const colors = {
    yellow:
      "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",

    purple:
      "bg-purple-500/10 border-purple-500/20 text-purple-400",

    green:
      "bg-green-500/10 border-green-500/20 text-green-400",
  };

  return (
    <div
      className={`rounded-lg border p-5 ${colors[color]}`}
    >
      <p className="text-sm">
        {title}
      </p>

      <p className="text-2xl font-bold mt-2">
        KES {(Number(amount) || 0).toLocaleString()}
      </p>
    </div>
  );
};

    // TRANSACTION BOX
const TransactionBox = ({
  title,
  value,
  className,
}) => {
  return (
    <div
      className={`rounded-lg border p-5 ${className}`}
    >
      <p className="text-sm">
        {title}
      </p>

      <p className="text-3xl font-bold mt-1">
        {value || 0}
      </p>
    </div>
  );
};

  // TAB BUTTON
const TabButton = ({
  active,
  onClick,
  children,
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 font-semibold transition border-b-2 ${
        active
          ? "border-cyan-400 text-cyan-400"
          : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      }`}
    >
      {children}
    </button>
  );
};

// SEARCH INPUT
const SearchInput = ({
  value,
  onChange,
  placeholder,
}) => {
  return (
    <div className="relative w-full md:w-72">

      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />

      <input
        type="text"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-cyan-500"
      />

    </div>
  );
};

export default AdminDashboard;