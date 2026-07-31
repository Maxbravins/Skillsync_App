import { useState, useEffect } from "react";
import { FaUsers, FaBriefcase, FaFileAlt, FaMoneyBillWave } from "react-icons/fa";
import api from "../../services/api";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const AdminReports = () => {
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [statsRes, txRes] = await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/transactions"),
        ]);

        if (isMounted) {
          setStats(statsRes.data.stats);
          setTransactions(txRes.data.transactions || []);
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

  const statusColor = (status) => {
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans transition-colors">
        <Navbar />
        <div className="text-center py-20 text-[var(--text-secondary)] text-xl">
          Loading Reports...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans transition-colors">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        <h1 className="text-3xl font-bold mb-8">Platform Reports</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)]">
            <div className="flex items-center gap-4">
              <FaUsers className="text-cyan-400 text-3xl" />
              <div>
                <p className="text-[var(--text-secondary)] text-sm font-medium">
                  Total Users
                </p>
                <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)]">
            <div className="flex items-center gap-4">
              <FaBriefcase className="text-purple-400 text-3xl" />
              <div>
                <p className="text-[var(--text-secondary)] text-sm font-medium">
                  Total Jobs
                </p>
                <p className="text-3xl font-bold">{stats?.totalJobs || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)]">
            <div className="flex items-center gap-4">
              <FaFileAlt className="text-green-400 text-3xl" />
              <div>
                <p className="text-[var(--text-secondary)] text-sm font-medium">
                  Applications
                </p>
                <p className="text-3xl font-bold">
                  {stats?.totalApplications || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)]">
            <div className="flex items-center gap-4">
              <FaMoneyBillWave className="text-yellow-400 text-3xl" />
              <div>
                <p className="text-[var(--text-secondary)] text-sm font-medium">
                  Total Revenue
                </p>
                <p className="text-3xl font-bold">
                  KES {stats?.totalRevenue?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>

        <div className="bg-[var(--bg-secondary)] rounded-xl overflow-hidden border border-[var(--border-color)] overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--bg-primary)]">
              <tr>
                <th className="px-4 py-3 text-left">Job</th>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Developer</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Receipt</th>
                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr
                    key={tx._id}
                    className="border-t border-[var(--border-color)] hover:bg-[var(--bg-primary)]"
                  >
                    <td className="px-4 py-3 font-medium">
                      {tx.job?.title || "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      {tx.client?.username || "Unknown"}
                    </td>
                    <td className="px-4 py-3">
                      {tx.developer?.username || "Unknown"}
                    </td>
                    <td className="px-4 py-3">
                      KES {tx.amount?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor(
                          tx.status
                        )}`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {tx.mpesaReceiptNumber || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-[var(--text-secondary)]"
                  >
                    No transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminReports;