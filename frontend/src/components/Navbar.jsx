import {
  Bell,
  BriefcaseBusiness,
  Globe,
  LogIn,
  LogOut,
  Menu,
  Moon,
  PlusCircle,
  Search,
  Sun,
  UserPlus,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import useAuth from "../hooks/useAuth";
import { getNotifications } from "../services/notification.service";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

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

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMobileMenu();
  };

  /*
   * Marketplace navigation for logged-out visitors.
   */
  const publicNavigation = (
    <>
      <Link
        to="/jobs"
        className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-cyan-400 transition"
      >
        <Search size={17} />
        Browse Jobs
      </Link>

      <Link
        to="/register?role=client"
        className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-cyan-400 transition"
      >
        <BriefcaseBusiness size={17} />
        Find Talent
      </Link>
    </>
  );

  return (
    <nav className="sticky top-0 z-50 bg-[var(--bg-secondary)]/90 backdrop-blur-xl border-b border-[var(--border-color)] shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="min-h-[68px] flex items-center gap-3">
          {/* Logo */}
          <Link
            to={
              user?.role === "client"
                ? "/client-dashboard"
                : user?.role === "developer"
                  ? "/developer-dashboard"
                  : user?.role === "admin"
                    ? "/admin-dashboard"
                    : "/"
            }
            className="flex shrink-0 items-center gap-2.5"
            onClick={closeMobileMenu}
          >
            <img
              src="/logo.png"
              alt="SkillSync"
              className="w-10 h-10 rounded-xl ring-2 ring-cyan-500/40"
            />

            <div className="hidden sm:block">
              <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">
                SkillSync
              </h1>

              <p className="text-[10px] text-[var(--text-secondary)]">
                Freelance Marketplace
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-7 ml-8">
            {!user && publicNavigation}

            {user?.role === "developer" && (
              <>
                <Link
                  to="/jobs"
                  className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-cyan-400 transition"
                >
                  <Search size={17} />
                  Browse Jobs
                </Link>

                <Link
                  to="/developer-dashboard"
                  className="text-[var(--text-secondary)] hover:text-cyan-400 transition"
                >
                  Dashboard
                </Link>

                <Link
                  to="/my-applications"
                  className="text-[var(--text-secondary)] hover:text-cyan-400 transition"
                >
                  Applications
                </Link>

                <Link
                  to="/premium"
                  className="text-yellow-400 hover:text-yellow-300 font-semibold transition"
                >
                  Premium
                </Link>
              </>
            )}

            {user?.role === "client" && (
              <>
                <Link
                  to="/jobs"
                  className="text-[var(--text-secondary)] hover:text-cyan-400 transition"
                >
                  Browse Jobs
                </Link>

                <Link
                  to="/client-dashboard"
                  className="text-[var(--text-secondary)] hover:text-cyan-400 transition"
                >
                  Dashboard
                </Link>

                <Link
                  to="/my-jobs"
                  className="text-[var(--text-secondary)] hover:text-cyan-400 transition"
                >
                  My Jobs
                </Link>

                <Link
                  to="/create-job"
                  className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold transition"
                >
                  <PlusCircle size={17} />
                  Post a Job
                </Link>

                <Link
                  to="/premium"
                  className="text-yellow-400 hover:text-yellow-300 font-semibold transition"
                >
                  Premium
                </Link>
              </>
            )}

            {user?.role === "admin" && (
              <>
                <Link
                  to="/admin-dashboard"
                  className="text-[var(--text-secondary)] hover:text-cyan-400 transition"
                >
                  Dashboard
                </Link>

                <Link
                  to="/jobs"
                  className="text-[var(--text-secondary)] hover:text-cyan-400 transition"
                >
                  Browse Jobs
                </Link>

                <Link
                  to="/admin/reports"
                  className="text-[var(--text-secondary)] hover:text-cyan-400 transition"
                >
                  Reports
                </Link>
              </>
            )}
          </div>

          {/* Right Controls
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {/* Language *
            <div className="hidden sm:flex items-center gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-1.5 text-xs">
              <Globe className="w-4 h-4 text-cyan-400" />

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="cursor-pointer bg-transparent outline-none text-[var(--text-primary)]"
                aria-label="Language"
              >
                <option
                  value="en"
                  className="bg-slate-900 text-white"
                >
                  EN
                </option>

                <option
                  value="sw"
                  className="bg-slate-900 text-white"
                >
                  SW
                </option>

                <option
                  value="fr"
                  className="bg-slate-900 text-white"
                >
                  FR
                </option>
              </select>
            </div> */}

            {/* Theme */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:text-cyan-400 transition"
              title="Toggle Dark/Light Mode"
              aria-label="Toggle theme"
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
                  className="relative p-1"
                  onClick={closeMobileMenu}
                  aria-label="Notifications"
                >
                  <Bell
                    className={`w-6 h-6 transition ${
                      unreadCount > 0
                        ? "text-cyan-400 animate-pulse"
                        : "text-[var(--text-secondary)] hover:text-cyan-400"
                    }`}
                  />

                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full min-w-5 h-5 px-1 flex items-center justify-center font-bold">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Profile */}
                <Link
                  to="/profile"
                  className="hidden sm:flex items-center gap-2"
                  onClick={closeMobileMenu}
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

                {/* Desktop Logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden sm:inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition font-medium text-sm"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* Desktop Login */}
                <Link
                  to="/login"
                  className="hidden sm:inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium"
                >
                  <LogIn size={16} />
                  Login
                </Link>

                {/* Desktop Register */}
                <Link
                  to="/register"
                  className="hidden sm:inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition"
                >
                  <UserPlus size={16} />
                  Register
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden inline-flex items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-2 text-[var(--text-primary)]"
              aria-label="Toggle navigation"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
            <div className="flex flex-col gap-1">
              {/* Public */}
              {!user && (
                <>
                  <Link
                    to="/jobs"
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-cyan-400"
                    onClick={closeMobileMenu}
                  >
                    <Search size={18} />
                    Browse Jobs
                  </Link>

                  <Link
                    to="/register?role=client"
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-cyan-400"
                    onClick={closeMobileMenu}
                  >
                    <BriefcaseBusiness size={18} />
                    Find Talent
                  </Link>

                  <div className="h-px bg-[var(--border-color)] my-2" />

                  <Link
                    to="/login"
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-cyan-400"
                    onClick={closeMobileMenu}
                  >
                    <LogIn size={18} />
                    Login
                  </Link>

                  <Link
                    to="/register"
                    className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500 px-3 py-3 text-sm font-semibold text-white"
                    onClick={closeMobileMenu}
                  >
                    <UserPlus size={18} />
                    Register
                  </Link>
                </>
              )}

              {/* Developer */}
              {user?.role === "developer" && (
                <>
                  <Link
                    to="/developer-dashboard"
                    className="mobile-nav-link"
                    onClick={closeMobileMenu}
                  >
                    Dashboard
                  </Link>

                  <Link
                    to="/jobs"
                    className="mobile-nav-link"
                    onClick={closeMobileMenu}
                  >
                    Browse Jobs
                  </Link>

                  <Link
                    to="/my-applications"
                    className="mobile-nav-link"
                    onClick={closeMobileMenu}
                  >
                    Applications
                  </Link>

                  <Link
                    to="/premium"
                    className="mobile-nav-link text-yellow-400"
                    onClick={closeMobileMenu}
                  >
                    Premium
                  </Link>

                  <Link
                    to="/profile"
                    className="mobile-nav-link"
                    onClick={closeMobileMenu}
                  >
                    Profile
                  </Link>

                  <Link
                    to="/notifications"
                    className="mobile-nav-link"
                    onClick={closeMobileMenu}
                  >
                    Notifications
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-2 flex items-center gap-3 rounded-lg bg-red-600 px-3 py-3 text-left text-sm font-medium text-white"
                  >
                    <LogOut size={18} />
                    {"Logout" || "Logout"}
                  </button>
                </>
              )}

              {/* Client */}
              {user?.role === "client" && (
                <>
                  <Link
                    to="/client-dashboard"
                    className="mobile-nav-link"
                    onClick={closeMobileMenu}
                  >
                    Dashboard
                  </Link>

                  <Link
                    to="/jobs"
                    className="mobile-nav-link"
                    onClick={closeMobileMenu}
                  >
                    Browse Jobs
                  </Link>

                  <Link
                    to="/my-jobs"
                    className="mobile-nav-link"
                    onClick={closeMobileMenu}
                  >
                    My Jobs
                  </Link>

                  <Link
                    to="/create-job"
                    className="mobile-nav-link text-cyan-400"
                    onClick={closeMobileMenu}
                  >
                    Post a Job
                  </Link>

                  <Link
                    to="/premium"
                    className="mobile-nav-link text-yellow-400"
                    onClick={closeMobileMenu}
                  >
                    Premium
                  </Link>

                  <Link
                    to="/profile"
                    className="mobile-nav-link"
                    onClick={closeMobileMenu}
                  >
                    Profile
                  </Link>

                  <Link
                    to="/notifications"
                    className="mobile-nav-link"
                    onClick={closeMobileMenu}
                  >
                    Notifications
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-2 flex items-center gap-3 rounded-lg bg-red-600 px-3 py-3 text-left text-sm font-medium text-white"
                  >
                    <LogOut size={18} />
                    {"Logout" || "Logout"}
                  </button>
                </>
              )}

              {/* Admin */}
              {user?.role === "admin" && (
                <>
                  <Link
                    to="/admin-dashboard"
                    className="mobile-nav-link"
                    onClick={closeMobileMenu}
                  >
                    Dashboard
                  </Link>

                  <Link
                    to="/jobs"
                    className="mobile-nav-link"
                    onClick={closeMobileMenu}
                  >
                    Browse Jobs
                  </Link>

                  <Link
                    to="/admin/reports"
                    className="mobile-nav-link"
                    onClick={closeMobileMenu}
                  >
                    Reports
                  </Link>

                  <Link
                    to="/profile"
                    className="mobile-nav-link"
                    onClick={closeMobileMenu}
                  >
                    Profile
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-2 flex items-center gap-3 rounded-lg bg-red-600 px-3 py-3 text-left text-sm font-medium text-white"
                  >
                    <LogOut size={18} />
                    {"Logout" || "Logout"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Small utility class used by mobile links */}
      <style>{`
        .mobile-nav-link {
          display: flex;
          align-items: center;
          border-radius: 0.5rem;
          padding: 0.75rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
          transition: all 0.2s ease;
        }

        .mobile-nav-link:hover {
          background: var(--bg-primary);
          color: #22d3ee;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
