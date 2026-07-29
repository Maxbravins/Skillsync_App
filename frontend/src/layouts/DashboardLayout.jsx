import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { FaHome, FaBriefcase, FaUser, FaFileAlt, FaBell, FaPlusCircle } from "react-icons/fa";

const DashboardLayout = () => {
  const { user, isDeveloper, isClient } = useAuth();
  const navItems = [
    ...(isClient ? [
      { to: "/client-dashboard", label: "Dashboard", icon: <FaHome /> },
      { to: "/my-jobs", label: "My Jobs", icon: <FaBriefcase /> },
      { to: "/create-job", label: "Post Job", icon: <FaPlusCircle /> },
    ] : []),
    ...(isDeveloper ? [
      { to: "/developer-dashboard", label: "Dashboard", icon: <FaHome /> },
      { to: "/my-applications", label: "My Applications", icon: <FaFileAlt /> },
    ] : []),
    { to: "/profile", label: "Profile", icon: <FaUser /> },
    { to: "/notifications", label: "Notifications", icon: <FaBell /> },
  ];
  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 fixed h-full">
        <h2 className="text-xl font-bold text-cyan-400 mb-8">Dashboard</h2>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${isActive ? "bg-cyan-500/20 text-cyan-400" : "hover:bg-slate-800 text-slate-400 hover:text-white"}`
            }>
              {item.icon} {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="ml-64 flex-1 p-8"><Outlet /></main>
    </div>
  );
};
export default DashboardLayout;
