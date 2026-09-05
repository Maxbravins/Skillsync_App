import {
  FaBell,
  FaBriefcase,
  FaFileAlt,
  FaHome,
  FaPlusCircle,
  FaUser,
} from "react-icons/fa";
import { NavLink, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const DashboardLayout = () => {
  const { user } = useAuth();

  const role = user?.role;

  const navItems = [
    ...(role === "client"
      ? [
          {
            to: "/client-dashboard",
            label: "Dashboard",
            icon: <FaHome />,
          },
          {
            to: "/my-jobs",
            label: "My Jobs",
            icon: <FaBriefcase />,
          },
          {
            to: "/create-job",
            label: "Post Job",
            icon: <FaPlusCircle />,
          },
        ]
      : []),

    ...(role === "developer"
      ? [
          {
            to: "/developer-dashboard",
            label: "Dashboard",
            icon: <FaHome />,
          },
          {
            to: "/my-applications",
            label: "My Applications",
            icon: <FaFileAlt />,
          },
        ]
      : []),

    {
      to: "/profile",
      label: "Profile",
      icon: <FaUser />,
    },

    {
      to: "/notifications",
      label: "Notifications",
      icon: <FaBell />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-64 flex-col bg-slate-900 border-r border-slate-800">
        {/* Brand */}
        <div className="px-6 py-6 border-b border-slate-800">
          <h1 className="text-2xl font-extrabold text-cyan-400">
            SkillSync
          </h1>

          <p className="text-xs text-slate-500 mt-1">
            {role === "client"
              ? "Client Dashboard"
              : role === "developer"
              ? "Developer Dashboard"
              : "Dashboard"}
          </p>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 px-4 py-6 space-y-2 overflow-y-auto"
          aria-label="Dashboard navigation"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to.includes("dashboard")}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 px-4 py-3 rounded-xl",
                  "font-medium transition-all duration-200",
                  isActive
                    ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800",
                ].join(" ")
              }
            >
              <span className="text-lg shrink-0">
                {item.icon}
              </span>

              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Info */}
        {user && (
          <div className="p-4 border-t border-slate-800">
            <div className="rounded-xl bg-slate-800/60 px-4 py-3">
              <p className="text-sm font-semibold truncate">
                {user.username || user.name || "User"}
              </p>

              <p className="text-xs text-slate-500 mt-1 capitalize">
                {role || "User"}
              </p>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-cyan-400">
                SkillSync
              </h1>

              <p className="text-xs text-slate-500 capitalize">
                {role || "Dashboard"}
              </p>
            </div>
          </div>

          <nav
            className="flex gap-2 mt-4 overflow-x-auto pb-1"
            aria-label="Mobile dashboard navigation"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to.includes("dashboard")}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-2 whitespace-nowrap",
                    "px-3 py-2 rounded-lg text-sm font-medium",
                    "transition-colors",
                    isActive
                      ? "bg-cyan-500/15 text-cyan-400"
                      : "text-slate-400 hover:text-white hover:bg-slate-800",
                  ].join(" ")
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
