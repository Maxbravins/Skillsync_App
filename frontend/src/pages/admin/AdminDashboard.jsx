import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaUsers, FaBriefcase, FaFileAlt, FaCheckCircle } from "react-icons/fa";
import api from "../../services/api";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { downloadApplicationsPDF } from "../../services/pdf.service";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [statsRes, usersRes, jobsRes] = await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/users"),
          api.get("/admin/jobs"),
        ]);
        if (isMounted) {
          setStats(statsRes.data.stats);
          setUsers(usersRes.data.users || []);
          setJobs(jobsRes.data.jobs || []);
        }
      } catch (error) {
        console.log(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleExportPDF = async () => {
  try {
    const blob = await downloadApplicationsPDF();

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "applications-report.pdf";

    document.body.appendChild(link);
    link.click();

    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error(error);
    alert("Failed to export PDF");
  }
};

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (error) {
      console.log(error);
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      await api.delete(`/admin/jobs/${id}`);
      setJobs((prev) => prev.filter((j) => j._id !== id));
    } catch (error) {
      console.log(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans transition-colors">
        <Navbar />
        <div className="text-center py-20 text-[var(--text-secondary)] text-xl">Loading Admin Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans transition-colors">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>

        <button
          onClick={handleExportPDF}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2 rounded-lg font-semibold transition"
        >
          Export Applications PDF
        </button>

         <Link
        to="/admin/reports"
        className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold transition"
      >
        View Reports
      </Link>
      </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)]">
            <div className="flex items-center gap-4">
              <FaUsers className="text-cyan-400 text-3xl" />
              <div>
                <p className="text-[var(--text-secondary)] text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)]">
            <div className="flex items-center gap-4">
              <FaBriefcase className="text-purple-400 text-3xl" />
              <div>
                <p className="text-[var(--text-secondary)] text-sm font-medium">Total Jobs</p>
                <p className="text-3xl font-bold">{stats?.totalJobs || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)]">
            <div className="flex items-center gap-4">
              <FaFileAlt className="text-green-400 text-3xl" />
              <div>
                <p className="text-[var(--text-secondary)] text-sm font-medium">Applications</p>
                <p className="text-3xl font-bold">{stats?.totalApplications || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)]">
            <div className="flex items-center gap-4">
              <FaCheckCircle className="text-yellow-400 text-3xl" />
              <div>
                <p className="text-[var(--text-secondary)] text-sm font-medium">Active Jobs</p>
                <p className="text-3xl font-bold">{stats?.activeJobs || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "users"
                ? "bg-cyan-500 text-white"
                : "bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)]"
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("jobs")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "jobs"
                ? "bg-cyan-500 text-white"
                : "bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)]"
            }`}
          >
            Jobs ({jobs.length})
          </button>
        </div>

        {/* Users List */}
        {activeTab === "users" && (
          <div className="bg-[var(--bg-secondary)] rounded-xl overflow-hidden border border-[var(--border-color)]">
            <table className="w-full">
              <thead className="bg-[var(--bg-primary)]">
                <tr>
                  <th className="px-4 py-3 text-left">Username</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-t border-[var(--border-color)] hover:bg-[var(--bg-primary)]">
                    <td className="px-4 py-3 font-medium">{user.username}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          user.role === "admin"
                            ? "bg-purple-500/20 text-purple-400"
                            : user.role === "client"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="text-red-400 hover:text-red-300 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Jobs List */}
        {activeTab === "jobs" && (
          <div className="bg-[var(--bg-secondary)] rounded-xl overflow-hidden border border-[var(--border-color)]">
            <table className="w-full">
              <thead className="bg-[var(--bg-primary)]">
                <tr>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Budget</th>
                  <th className="px-4 py-3 text-left">Posted By</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job._id} className="border-t border-[var(--border-color)] hover:bg-[var(--bg-primary)]">
                    <td className="px-4 py-3 font-medium">{job.title}</td>
                    <td className="px-4 py-3">KES {job.budget}</td>
                    <td className="px-4 py-3">{job.client?.username || "Unknown"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          job.status === "open" || !job.status
                            ? "bg-green-500/20 text-green-400"
                            : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {job.status || "open"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteJob(job._id)}
                        className="text-red-400 hover:text-red-300 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;