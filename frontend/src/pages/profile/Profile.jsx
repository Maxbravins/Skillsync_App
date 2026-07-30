import useAuth from "../../hooks/useAuth";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import {
  User,
  Mail,
  Shield,
  Phone,
  MapPin,
  Github,
  Linkedin,
  Globe,
  FileText,
  Edit,
} from "lucide-react";

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-[var(--text-secondary)]">
              Manage your personal information
            </p>
          </div>

          <Link
            to="/edit-profile"
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg transition"
            >
            <Edit size={18} />
            Edit Profile
          </Link>
        </div>

        {/* Profile Card */}
        <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-8">

          {/* Top Section */}
          <div className="flex flex-col md:flex-row gap-6 items-center border-b border-[var(--border-color)] pb-8">

            {user?.profilePicture ? (
              <img
                src={`http://localhost:5000${user.profilePicture}`}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 flex items-center justify-center text-5xl font-bold text-white">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <h2 className="text-2xl font-bold">
                {user?.username}
              </h2>

              <p className="capitalize text-cyan-400">
                {user?.role}
              </p>

              <p className="mt-3 text-[var(--text-secondary)]">
                {user?.bio || "No bio added yet."}
              </p>
            </div>
          </div>

          {/* Information */}
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
              icon={<Shield size={18} />}
              label="Role"
              value={user?.role}
            />

            <Info
              icon={<Phone size={18} />}
              label="Phone"
              value={user?.phone}
            />

            <Info
              icon={<MapPin size={18} />}
              label="Location"
              value={user?.location}
            />

            <Info
              icon={<Github size={18} />}
              label="GitHub"
              value={user?.github}
            />

            <Info
              icon={<Linkedin size={18} />}
              label="LinkedIn"
              value={user?.linkedin}
            />

            <Info
              icon={<Globe size={18} />}
              label="Portfolio"
              value={user?.portfolio}
            />
          </div>

          {/* Skills */}
          <div className="mt-8">
            <h3 className="font-semibold mb-3">Skills</h3>

            <div className="flex flex-wrap gap-2">
              {user?.skills?.length > 0 ? (
                user.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-[var(--text-secondary)]">
                  No skills added.
                </p>
              )}
            </div>
          </div>

          {/* Resume */}
          <div className="mt-8">
            <h3 className="font-semibold mb-3">
              Resume
            </h3>

            {user?.resume ? (
              <a
                href={`http://localhost:5000${user.resume}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-cyan-400 hover:underline"
              >
                <FileText size={18} />
                View Resume
              </a>
            ) : (
              <p className="text-[var(--text-secondary)]">
                No resume uploaded.
              </p>
            )}
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

      <p>{value || "Not provided"}</p>
    </div>
  </div>
);

export default Profile;