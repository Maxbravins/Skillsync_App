import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const MainLayout = () => {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-cyan-400">SkillSync</Link>
          <div className="flex items-center gap-4">
            <Link to="/jobs" className="hover:text-cyan-400">Browse Jobs</Link>
            {user ? (
              <>
                <Link to="/dashboard" className="hover:text-cyan-400">Dashboard</Link>
                <Link to="/profile" className="hover:text-cyan-400">Profile</Link>
                <button onClick={logout} className="text-red-400 hover:text-red-300">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-cyan-400">Login</Link>
                <Link to="/register" className="bg-cyan-500 px-4 py-2 rounded-lg hover:bg-cyan-600">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8"><Outlet /></main>
      <footer className="bg-slate-900 border-t border-slate-800 px-6 py-4 text-center text-slate-400 text-sm">
        &copy; {new Date().getFullYear()} SkillSync. All rights reserved.
      </footer>
    </div>
  );
};
export default MainLayout;
