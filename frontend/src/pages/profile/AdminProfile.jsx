import useAuth from "../../hooks/useAuth";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import {
  ShieldCheck,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  CheckCircle,
} from "lucide-react";

const AdminProfile = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const profileImage = user.profilePicture
    ? user.profilePicture
    : null;

  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Not available";

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-red-400" size={30} />

              <h1 className="text-3xl font-bold">
                Administrator Profile
              </h1>
            </div>

            <p className="mt-2 text-[var(--text-secondary)]">
              Manage your administrator account and personal information.
            </p>
          </div>

          <Link
            to="/edit-profile"
            className="inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2.5 rounded-lg transition"
          >
            <Edit size={18} />
            Edit Profile
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
          {/* Profile Header */}
          <div className="p-8 border-b border-[var(--border-color)]">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Avatar */}
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={`${user.username}'s profile`}
                  className="w-32 h-32 rounded-full object-cover border-4 border-red-500/40"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-5xl font-bold text-white shadow-lg">
                  {user.username?.charAt(0)?.toUpperCase() || "A"}
                </div>
              )}

              {/* Identity */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-3xl font-bold">
                    {user.username}
                  </h2>

                  <span className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-sm font-medium">
                    <ShieldCheck size={15} />
                    Administrator
                  </span>
                </div>

                <p className="mt-3 text-[var(--text-secondary)] max-w-2xl">
                  {user.bio ||
                    "System administrator responsible for managing and monitoring the SkillSync platform."}
                </p>

                <div className="flex flex-wrap gap-3 mt-4">
                  {user.isVerified && (
                    <span className="inline-flex items-center gap-1.5 text-green-400 text-sm">
                      <CheckCircle size={16} />
                      Verified Account
                    </span>
                  )}

                  {user.authProvider && (
                    <span className="text-sm text-[var(--text-secondary)] capitalize">
                      Authentication: {user.authProvider}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="p-8">
            <h3 className="text-xl font-semibold mb-6">
              Account Information
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              <Info
                icon={<User size={18} />}
                label="Username"
                value={user.username}
              />

              <Info
                icon={<Mail size={18} />}
                label="Email"
                value={user.email}
                isEmail
              />

              <Info
                icon={<ShieldCheck size={18} />}
                label="Account Role"
                value="Administrator"
              />

              <Info
                icon={<Calendar size={18} />}
                label="Member Since"
                value={joinedDate}
              />

              <Info
                icon={<Phone size={18} />}
                label="Phone"
                value={user.phone}
              />

              <Info
                icon={<MapPin size={18} />}
                label="Location"
                value={user.location}
              />
            </div>
          </div>

          {/* Account Status */}
          <div className="px-8 pb-8">
            <h3 className="text-xl font-semibold mb-6">
              Account Status
            </h3>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatusCard
                label="Account"
                value="Active"
                color="green"
              />

              <StatusCard
                label="Email Verification"
                value={
                  user.verificationDocuments?.emailVerified
                    ? "Verified"
                    : "Not Verified"
                }
                color={
                  user.verificationDocuments?.emailVerified
                    ? "green"
                    : "yellow"
                }
              />

              <StatusCard
                label="Identity Verification"
                value={
                  user.verificationDocuments?.idVerified
                    ? "Verified"
                    : "Not Verified"
                }
                color={
                  user.verificationDocuments?.idVerified
                    ? "green"
                    : "yellow"
                }
              />
            </div>
          </div>

          {/* Administrator Notice */}
          <div className="mx-8 mb-8 rounded-xl border border-red-500/20 bg-red-500/5 p-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                <ShieldCheck size={20} />
              </div>

              <div>
                <h3 className="font-semibold text-red-400">
                  Administrator Account
                </h3>

                <p className="mt-2 text-sm text-[var(--text-secondary)] leading-6">
                  This account has administrator privileges on the
                  SkillSync platform. Sensitive administrator permissions,
                  authentication settings, and system-level controls are
                  managed separately and cannot be changed from the profile
                  editor.
                </p>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="px-8 pb-8">
            <h3 className="text-xl font-semibold mb-6">
              Administrator Access
            </h3>

            <div className="grid sm:grid-cols-2 gap-3">
              <Permission text="Manage users" />
              <Permission text="Manage jobs" />
              <Permission text="Manage applications" />
              <Permission text="Monitor platform activity" />
              <Permission text="View platform reports" />
              <Permission text="Manage system notifications" />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

/* ============================================================
   INFO COMPONENT
============================================================ */

const Info = ({ icon, label, value, isEmail = false }) => {
  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-lg bg-[var(--bg-primary)] flex items-center justify-center text-cyan-400 shrink-0">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
          {label}
        </p>

        {isEmail && value ? (
          <a
            href={`mailto:${value}`}
            className="break-all text-cyan-400 hover:underline"
          >
            {value}
          </a>
        ) : (
          <p className="break-words">
            {value || "Not provided"}
          </p>
        )}
      </div>
    </div>
  );
};

/* ============================================================
   STATUS CARD
============================================================ */

const StatusCard = ({ label, value, color }) => {
  const colors = {
    green: {
      wrapper: "bg-green-500/10 border-green-500/20",
      text: "text-green-400",
    },
    yellow: {
      wrapper: "bg-yellow-500/10 border-yellow-500/20",
      text: "text-yellow-400",
    },
    red: {
      wrapper: "bg-red-500/10 border-red-500/20",
      text: "text-red-400",
    },
  };

  const style = colors[color] || colors.green;

  return (
    <div
      className={`rounded-xl border p-5 ${style.wrapper}`}
    >
      <p className="text-sm text-[var(--text-secondary)]">
        {label}
      </p>

      <p className={`mt-2 font-semibold ${style.text}`}>
        {value}
      </p>
    </div>
  );
};

/* ============================================================
   PERMISSION
============================================================ */

const Permission = ({ text }) => {
  return (
    <div className="flex items-center gap-3 bg-green-500/10 text-green-400 px-4 py-3 rounded-lg border border-green-500/20">
      <CheckCircle size={18} />
      <span>{text}</span>
    </div>
  );
};

export default AdminProfile;
