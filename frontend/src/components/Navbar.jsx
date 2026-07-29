import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";
import { getNotifications } from "../services/notification.service";

const Navbar = () => {
  const { user, logout } = useAuth();

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 5000);

    return () => clearInterval(interval);
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications);
    } catch (error) {
      console.log(error);
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur border-b border-slate-800 px-6 py-4 shadow-lg">

      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Logo */}
        <Link
          to={
            user?.role === "client"
              ? "/client-dashboard"
              : "/developer-dashboard"
          }
          className="flex items-center gap-3"
        >
          <img
            src="/logo.png"
            alt="SkillSync"
            className="w-10 h-10 rounded-xl ring-2 ring-cyan-500/40"
          />

          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">
              SkillSync
            </h1>

            <p className="text-[11px] text-slate-500">
              Freelance Marketplace
            </p>
          </div>
        </Link>

        {/* Navigation */}
        {user && (
          <div className="hidden lg:flex items-center gap-8">

            {user.role === "client" && (
              <>
                <Link
                  to="/client-dashboard"
                  className="text-slate-300 hover:text-cyan-400 transition"
                >
                  Dashboard
                </Link>

                <Link
                  to="/my-jobs"
                  className="text-slate-300 hover:text-cyan-400 transition"
                >
                  My Jobs
                </Link>

                <Link
                  to="/create-job"
                  className="text-slate-300 hover:text-cyan-400 transition"
                >
                  Create Job
                </Link>

                <Link
                  to="/profile"
                  className="text-slate-300 hover:text-cyan-400 transition"
                >
                  Profile
                </Link>
              </>
            )}

            {user.role === "developer" && (
              <>
                <Link
                  to="/developer-dashboard"
                  className="text-slate-300 hover:text-cyan-400 transition"
                >
                  Dashboard
                </Link>

                <Link
                  to="/jobs"
                  className="text-slate-300 hover:text-cyan-400 transition"
                >
                  Browse Jobs
                </Link>

                <Link
                  to="/my-applications"
                  className="text-slate-300 hover:text-cyan-400 transition"
                >
                  Applications
                </Link>

                <Link
                  to="/profile"
                  className="text-slate-300 hover:text-cyan-400 transition"
                >
                  Profile
                </Link>
              </>
            )}

          </div>
        )}

        {/* Right Side */}
        <div className="flex items-center gap-5">

          {user ? (
            <>
              {/* Notifications */}

              <Link
                to="/notifications"
                className="relative"
              >
                <Bell
                  className={`w-6 h-6 transition ${
                    unreadCount > 0
                      ? "text-cyan-400 animate-pulse"
                      : "text-slate-300 hover:text-cyan-400"
                  }`}
                />

                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </Link>

              {/* User */}

              <Link
                to="/profile"
                className="flex items-center gap-2"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                  {user.username
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-white">
                    {user.username}
                  </p>

                  <p className="text-xs text-slate-400 capitalize">
                    {user.role}
                  </p>
                </div>
              </Link>

              {/* Logout */}

              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-slate-300 hover:text-white"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="bg-gradient-to-r from-cyan-500 to-indigo-500 text-white px-5 py-2 rounded-lg font-semibold"
              >
                Register
              </Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;