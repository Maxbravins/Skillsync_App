import { Bell, Globe, Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import useAuth from "../hooks/useAuth";
import { getNotifications } from "../services/notification.service";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const [notifications, setNotifications] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    (notification) => !notification.isRead,
  ).length;

  return (
    <nav className="sticky top-0 z-50 bg-[var(--bg-secondary)]/90 backdrop-blur border-b border-[var(--border-color)] px-3 py-3 shadow-lg sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Logo */}
        <Link
          to={
            user?.role === "client"
              ? "/client-dashboard"
              : user?.role === "admin"
                ? "/admin-dashboard"
                : "/developer-dashboard"
          }
          className="flex min-w-0 items-center gap-3"
        >
          <img
            src="/logo.png"
            alt="SkillSync"
            className="w-10 h-10 rounded-xl ring-2 ring-cyan-500/40"
          />

          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent sm:text-xl">
              SkillSync
            </h1>

            <p className="truncate text-[10px] text-[var(--text-secondary)] sm:text-[11px]">
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
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2 sm:gap-4">
          {/* Language Selector */}
          <div className="flex items-center gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-1 text-[10px] text-[var(--text-primary)] sm:text-xs">
            <Globe className="w-4 h-4 text-cyan-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="cursor-pointer bg-transparent text-[10px] outline-none text-[var(--text-primary)] sm:text-xs"
            >
              <option value="en" className="bg-slate-900 text-white">
                EN
              </option>
              <option value="sw" className="bg-slate-900 text-white">
                SW
              </option>
              <option value="fr" className="bg-slate-900 text-white">
                FR
              </option>
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
              <Link
                to="/notifications"
                className="relative"
                onClick={() => setMobileMenuOpen(false)}
              >
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
              <Link
                to="/profile"
                className="flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
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
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="hidden sm:inline-flex bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition font-medium text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:inline-flex text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium"
              >
                {t("login")}
              </Link>

              <Link
                to="/register"
                className="hidden sm:inline-flex bg-gradient-to-r from-cyan-500 to-indigo-500 text-white px-5 py-2 rounded-lg font-semibold text-sm"
              >
                {t("register")}
              </Link>
            </>
          )}
        </div>

        {user && (
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex lg:hidden items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-2 text-[var(--text-primary)]"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      {mobileMenuOpen && (
        <div className="mx-auto mt-3 flex max-w-7xl flex-col gap-2 border-t border-[var(--border-color)] pt-3 lg:hidden">
          {user ? (
            <>
              {user.role === "client" && (
                <>
                  <Link
                    to="/client-dashboard"
                    className="rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-cyan-400"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("dashboard")}
                  </Link>
                  <Link
                    to="/my-jobs"
                    className="rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-cyan-400"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("myJobs")}
                  </Link>
                  <Link
                    to="/create-job"
                    className="rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-cyan-400"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("createJob")}
                  </Link>
                  <Link
                  to="/premium"
                  className="text-[var(--text-secondary)] hover:text-yellow-400 transition"
                >
                   Premium
                </Link>
                <Link
                    to="/profile"
                    className="rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-cyan-400"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("profile")}
                  </Link>
                </>
              )}

              {user.role === "developer" && (
                <>
                  <Link
                    to="/developer-dashboard"
                    className="rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-cyan-400"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("dashboard")}
                  </Link>
                  <Link
                    to="/jobs"
                    className="rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-cyan-400"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("browseJobs")}
                  </Link>
                  <Link
                    to="/my-applications"
                    className="rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-cyan-400"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("applications")}
                  </Link>
                  <Link
                    to="/premium"
                    className="text-[var(--text-secondary)] hover:text-yellow-400 transition"
                  >
                     Premium
                  </Link>
                  <Link
                    to="/profile"
                    className="rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-cyan-400"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("profile")}
                  </Link>
                </>
              )}

              {user.role === "admin" && (
                <>
                  <Link
                    to="/admin-dashboard"
                    className="rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-cyan-400"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("dashboard")}
                  </Link>
                  <Link
                    to="/jobs"
                    className="rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-cyan-400"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("browseJobs")}
                  </Link>
                </>
              )}

              <Link
                to="/notifications"
                className="rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-cyan-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("notifications")}
              </Link>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="rounded-lg bg-red-600 px-3 py-2 text-left text-sm font-medium text-white"
              >
                {t("logout") || "Logout"}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-cyan-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("login")}
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500 px-3 py-2 text-center text-sm font-semibold text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("register")}
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
