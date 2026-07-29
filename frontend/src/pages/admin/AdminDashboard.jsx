import { useState, useEffect } from "react";
import { FaUsers, FaBriefcase, FaFileAlt, FaCheckCircle } from "react-icons/fa";
import api from "../../services/api";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("stats");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, jobsRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/admin/jobs"),
      ]);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users);
      setJobs(jobsRes.data.jobs);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(users.filter((u) => u._id !== id));
    } catch (error) {
      console.log(error);
    }
  };

  const handleDeleteJob = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      await api.delete(`/admin/jobs/${id}`);
      setJobs(jobs.filter((j) => j._id !== id));
    } catch (error) {
      console.log(error);
    }
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-4">
              <FaUsers className="text-cyan-400 text-3xl" />
              <div>
                <p className="text-slate-400 text-sm">Total Users</p>
                <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-4">
              <FaBriefcase className="text-purple-400 text-3xl" />
              <div>
                <p className="text-slate-400 text-sm">Total Jobs</p>
                <p className="text-3xl font-bold">{stats?.totalJobs || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-4">
              <FaFileAlt className="text-green-400 text-3xl" />
              <div>
                <p className="text-slate-400 text-sm">Applications</p>
                <p className="text-3xl font-bold">{stats?.totalApplications || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-4">
              <FaCheckCircle className="text-yellow-400 text-3xl" />
              <div>
                <p className="text-slate-400 text-sm">Active Jobs</p>
                <p className="text-3xl font-bold">{stats?.activeJobs || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-lg ${activeTab === "users" ? "bg-cyan-500" : "bg-slate-800"}`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("jobs")}
            className={`px-4 py-2 rounded-lg ${activeTab === "jobs" ? "bg-cyan-500" : "bg-slate-800"}`}
          >
            Jobs ({jobs.length})
          </button>
        </div>

        {/* Users List */}
        {activeTab === "users" && (
          <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
            <table className="w-full">
              <thead className="bg-slate-800">
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
                  <tr key={user._id} className="border-t border-slate-800 hover:bg-slate-800/50">
                    <td className="px-4 py-3">{user.username}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.role === "admin" ? "bg-purple-500/20 text-purple-400" :
                        user.role === "client" ? "bg-blue-500/20 text-blue-400" :
                        "bg-green-500/20 text-green-400"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="text-red-400 hover:text-red-300"
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
          <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
            <table className="w-full">
              <thead className="bg-slate-800">
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
                  <tr key={job._id} className="border-t border-slate-800 hover:bg-slate-800/50">
                    <td className="px-4 py-3">{job.title}</td>
                    <td className="px-4 py-3">KES {job.budget}</td>
                    <td className="px-4 py-3">{job.createdBy?.username || "Unknown"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        job.status === "open" ? "bg-green-500/20 text-green-400" :
                        job.status === "filled" ? "bg-blue-500/20 text-blue-400" :
                        "bg-red-500/20 text-red-400"
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteJob(job._id)}
                        className="text-red-400 hover:text-red-300"
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
    </div>
  );
};

export default AdminDashboard;