import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getClientDashboard } from "../../services/dashboard.service";
import Navbar from "../../components/Navbar";

const ClientDashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const data = await getClientDashboard();
      setStats(data.dashboard);
    } catch (error) {
      console.log(error);
    }
  }; 

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Client Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Manage your job listings and track developer applications.</p>
          </div>
          <Link 
            to="/create-job"
            className="self-start md:self-auto px-5 py-2.5 font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 rounded-lg transition-all shadow-md shadow-cyan-950/20"
          >
            + Create New Job
          </Link>
        </div>

        {stats && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-slate-300 mb-5">Dashboard Statistics</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">

              {/* Total Jobs */}
          <Link
            to="/my-jobs"
            className="bg-slate-900/40 backdrop-blur border border-slate-800/80 p-5 rounded-xl flex flex-col justify-between min-h-[120px] hover:border-indigo-500 hover:scale-105 transition-all cursor-pointer"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Total Jobs
            </span>

            <span className="text-3xl font-extrabold text-white mt-2">
              {stats.totalJobs}
            </span>
          </Link>

              {/* Total Applications */}
         <Link
            to="/job-applicants/all"
            className="bg-slate-900/40 backdrop-blur border border-slate-800/80 p-5 rounded-xl flex flex-col justify-between min-h-[120px] hover:border-cyan-500 hover:scale-105 transition-all cursor-pointer"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Applications
            </span>

            <span className="text-3xl font-extrabold text-white mt-2">
              {stats.totalApplications}
            </span>
        </Link>

              {/* Pending */}
        <Link
                to="/job-applicants/pending"
                className="bg-slate-900/40 backdrop-blur border border-slate-800/80 p-5 rounded-xl flex flex-col justify-between min-h-[120px] hover:border-amber-500 hover:scale-105 transition-all cursor-pointer"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Pending Review
                </span>

                <span className="text-3xl font-extrabold text-white mt-2">
                  {stats.pendingApplications}
                </span>
        </Link>

              {/* Accepted */}
        <Link
                to="/job-applicants/accepted"
                className="bg-slate-900/40 backdrop-blur border border-slate-800/80 p-5 rounded-xl flex flex-col justify-between min-h-[120px] hover:border-green-500 hover:scale-105 transition-all cursor-pointer"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Accepted
                </span>

                <span className="text-3xl font-extrabold text-white mt-2">
                  {stats.acceptedApplications}
                </span>
        </Link>

              {/* Rejected */}
        <Link
                to="/job-applicants/rejected"
                className="bg-slate-900/40 backdrop-blur border border-slate-800/80 p-5 rounded-xl flex flex-col justify-between min-h-[120px] hover:border-red-500 hover:scale-105 transition-all cursor-pointer"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                  Rejected
                </span>

                <span className="text-3xl font-extrabold text-white mt-2">
                  {stats.rejectedApplications}
                </span>
        </Link>
            </div>
          </section>
        )}

        <hr className="border-slate-900 my-10" />

        <section>
          <h2 className="text-lg font-semibold text-slate-300 mb-6 font-sans">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link 
              to="/create-job" 
              className="group bg-slate-900/30 hover:bg-slate-900/50 backdrop-blur border border-slate-800/60 hover:border-cyan-500/40 p-6 rounded-xl transition-all"
            >
              <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">Create Job</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">Publish a new job listing to attract developers with specific skills.</p>
            </Link>

            <Link 
              to="/my-jobs" 
              className="group bg-slate-900/30 hover:bg-slate-900/50 backdrop-blur border border-slate-800/60 hover:border-cyan-500/40 p-6 rounded-xl transition-all"
            >
              <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">My Jobs</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">Manage active jobs, view candidate counts, and update descriptions.</p>
            </Link>

            <Link 
              to="/profile" 
              className="group bg-slate-900/30 hover:bg-slate-900/50 backdrop-blur border border-slate-800/60 hover:border-cyan-500/40 p-6 rounded-xl transition-all"
            >
              <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">My Profile</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">View and edit your company information, logo, and contact details.</p>
            </Link>
            
            <Link 
            to="/notifications"
             className="group bg-slate-900/30 hover:bg-slate-900/50 backdrop-blur border border-slate-800/60 hover:border-cyan-500/40 p-6 rounded-xl transition-all"
             >
             <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">Notifications</h3> 
              <p className="text-slate-400 text-sm mt-2">Stay updated on new applications, accepted jobs, and account activity.</p>
            </Link>
          
          </div>
        </section>
      </main>
    </div>
  );
};

export default ClientDashboard;