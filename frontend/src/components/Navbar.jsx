import { Link } from "react-router-dom";
import { Bell, Sun, Moon, Globe } from "lucide-react";
import { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { getNotifications } from "../services/notification.service";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

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
      setNotifications(data.notifications || []);
    } catch (error) {
      console.log(error);
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  return (
    <nav className="sticky top-0 z-50 bg-[var(--bg-secondary)]/90 backdrop-blur border-b border-[var(--border-color)] px-6 py-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link
          to={
            user?.role === "client"
              ? "/client-dashboard"
              : user?.role === "admin"
              ? "/admin-dashboard"
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

            <p className="text-[11px] text-[var(--text-secondary)]">
              Freelance Marketplace
            </p>
          </div>
        </Link>

        {/* Navigation Links */}
        {user && (
          <div className="hidden lg:flex items-center gap-8">
            {user.role === "client" && (
              <>
                <Link
                  to="/client-dashboard"
                  className="text-[var(--text-secondary)] hover:text-cyan-400 transition"
                >
                  {t("dashboard")}
                </Link>

                <Link
                  to="/my-jobs"
                  className="text-[var(--text-secondary)] hover:text-cyan-400 transition"
                >
                  {t("myJobs")}
                </Link>

                <Link
                  to="/create-job"
                  className="text-[var(--text-secondary)] hover:text-cyan-400 transition"
                >
                  {t("createJob")}
                </Link>

                <Link
                  to="/profile"
                  className="text-[var(--text-secondary)] hover:text-cyan-400 transition"
                >
                  {t("profile")}
                </Link>
              </>
            )}

            {user.role === "developer" && (
              <>
                <Link
                  to="/developer-dashboard"
                  className="text-[var(--text-secondary)] hover:text-cyan-400 transition"
                >
                  {t("dashboard")}
                </Link>

                <Link
                  to="/jobs"
                  className="text-[var(--text-secondary)] hover:text-cyan-400 transition"
                >
                  {t("browseJobs")}
                </Link>

                <Link
                  to="/my-applications"
                  className="text-[var(--text-secondary)] hover:text-cyan-400 transition"
                >
                  {t("applications")}
                </Link>

                <Link
                  to="/profile"
                  className="text-[var(--text-secondary)] hover:text-cyan-400 transition"
                >
                  {t("profile")}
                </Link>
              </>
            )}

            {user.role === "admin" && (
              <>
                <Link
                  to="/admin-dashboard"
                  className="text-[var(--text-secondary)] hover:text-cyan-400 transition"
                >
                  {t("dashboard")}
                </Link>
                <Link
                  to="/jobs"
                  className="text-[var(--text-secondary)] hover:text-cyan-400 transition"
                >
                  {t("browseJobs")}
                </Link>
              </>
            )}
          </div>
        )}

        {/* Controls (Theme, Language, Notifications, User) */}
        <div className="flex items-center gap-4">
          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-[var(--bg-primary)] px-2 py-1 rounded-lg border border-[var(--border-color)] text-xs text-[var(--text-primary)]">
            <Globe className="w-4 h-4 text-cyan-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent outline-none cursor-pointer text-[var(--text-primary)]"
            >
              <option value="en" className="bg-slate-900 text-white">EN</option>
              <option value="sw" className="bg-slate-900 text-white">SW</option>
              <option value="fr" className="bg-slate-900 text-white">FR</option>
            </select>
          </div>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:text-cyan-400 transition"
            title="Toggle Dark/Light Mode"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-500" />
            )}
          </button>

          {user ? (
            <>
              {/* Notifications */}
              <Link to="/notifications" className="relative">
                <Bell
                  className={`w-6 h-6 transition ${
                    unreadCount > 0
                      ? "text-cyan-400 animate-pulse"
                      : "text-[var(--text-secondary)] hover:text-cyan-400"
                  }`}
                />

                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </Link>

              {/* User Avatar */}
              <Link to="/profile" className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                  {user.username?.charAt(0).toUpperCase() || "U"}
                </div>

                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {user.username}
                  </p>

                  <p className="text-xs text-[var(--text-secondary)] capitalize">
                    {user.role}
                  </p>
                </div>
              </Link>

              {/* Logout */}
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition font-medium text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium"
              >
                {t("login")}
              </Link>

              <Link
                to="/register"
                className="bg-gradient-to-r from-cyan-500 to-indigo-500 text-white px-5 py-2 rounded-lg font-semibold text-sm"
              >
                {t("register")}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;