import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60 px-6 py-4 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
        <img 
          src="/logo.png" 
          alt="SkillSync Logo" 
          className="h-9 w-9 rounded-lg object-cover ring-2 ring-cyan-500/30"
        />
        <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent tracking-wide">
          SkillSync
        </span>
      </Link>

      <div className="flex items-center gap-6">
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-slate-300 text-sm hidden sm:inline">
              Welcome, <strong className="text-white font-medium">{user.username}</strong>
            </span>
            <button 
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-all cursor-pointer shadow-sm"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link 
              to="/login"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link 
              to="/register"
              className="px-4 py-2 text-sm font-medium text-slate-950 bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 rounded-lg transition-all shadow-md shadow-cyan-950/20 font-semibold"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;