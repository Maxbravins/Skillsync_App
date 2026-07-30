import useAuth from "../../hooks/useAuth";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import {
  ShieldCheck,
  User,
  Mail,
  Calendar,
  Users,
  Briefcase,
  FileText,
  Edit,
} from "lucide-react";

const AdminProfile = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-10">

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Administrator Profile</h1>
            <p className="text-[var(--text-secondary)]">
              Manage your administrator account
            </p>
          </div>

          <Link
            to="/edit-profile"
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg"
          >
            <Edit size={18} />
            Edit Profile
          </Link>
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-8">

          <div className="flex flex-col md:flex-row gap-6 items-center border-b border-[var(--border-color)] pb-8">

            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center text-5xl font-bold text-white">
              {user?.username?.charAt(0).toUpperCase()}
            </div>

            <div>
              <h2 className="text-3xl font-bold">
                {user?.username}
              </h2>

              <p className="text-red-400">
                System Administrator
              </p>

              <p className="mt-3 text-[var(--text-secondary)]">
                Full access to SkillSync management and monitoring.
              </p>

            </div>

          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-8">

            <Info
              icon={<User size={18} />}
              label="Username"
              value={user?.username}
            />

            <Info
              icon={<Mail size={18} />}
              label="Email"
              value={user?.email}
            />

            <Info
              icon={<ShieldCheck size={18} />}
              label="Role"
              value="Administrator"
            />

            <Info
              icon={<Calendar size={18} />}
              label="Joined"
              value={
                user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "Not available"
              }
            />

          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-10">

            <Stat
              icon={<Users className="mx-auto text-cyan-400 mb-2" />}
              title="Total Users"
              value={user?.totalUsers || 0}
            />

            <Stat
              icon={<Briefcase className="mx-auto text-green-400 mb-2" />}
              title="Total Jobs"
              value={user?.totalJobs || 0}
            />

            <Stat
              icon={<FileText className="mx-auto text-indigo-400 mb-2" />}
              title="Applications"
              value={user?.totalApplications || 0}
            />

          </div>

          <div className="mt-10">

            <h3 className="font-semibold text-lg mb-4">
              Administrator Permissions
            </h3>

            <div className="grid md:grid-cols-2 gap-3">

              <Permission text="Manage Users" />
              <Permission text="Manage Jobs" />
              <Permission text="Manage Applications" />
              <Permission text="Manage Notifications" />
              <Permission text="View Reports" />
              <Permission text="Delete Accounts" />
              <Permission text="Access Dashboard Analytics" />
              <Permission text="System Configuration" />

            </div>

          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
};

const Info = ({ icon, label, value }) => (
  <div className="flex gap-4">

    <div className="w-10 h-10 rounded-lg bg-[var(--bg-primary)] flex items-center justify-center text-cyan-400">
      {icon}
    </div>

    <div>
      <p className="text-xs uppercase text-[var(--text-secondary)]">
        {label}
      </p>

      <p>{value}</p>
    </div>

  </div>
);

const Stat = ({ icon, title, value }) => (
  <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-6 text-center">

    {icon}

    <h3 className="text-sm text-[var(--text-secondary)]">
      {title}
    </h3>

    <p className="text-3xl font-bold mt-2">
      {value}
    </p>

  </div>
);

const Permission = ({ text }) => (
  <div className="bg-green-500/10 text-green-400 px-4 py-3 rounded-lg border border-green-500/20">
    ✓ {text}
  </div>
);

export default AdminProfile;