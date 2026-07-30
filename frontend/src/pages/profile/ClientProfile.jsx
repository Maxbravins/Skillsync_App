import useAuth from "../../hooks/useAuth";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Briefcase,
  Edit,
} from "lucide-react";

const ClientProfile = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-10">

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Company Profile</h1>
            <p className="text-[var(--text-secondary)]">
              Manage your company information
            </p>
          </div>

          <Link
            to="/edit-profile"
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-lg text-white"
          >
            <Edit size={18}/>
            Edit Profile
          </Link>
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-8">

          <div className="flex flex-col md:flex-row gap-6 items-center border-b border-[var(--border-color)] pb-8">

            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 flex items-center justify-center text-5xl font-bold text-white">
              {user?.username?.charAt(0).toUpperCase()}
            </div>

            <div>
              <h2 className="text-3xl font-bold">
                {user?.company || "Company Name"}
              </h2>

              <p className="text-cyan-400 capitalize">
                Client Account
              </p>

              <p className="mt-3 text-[var(--text-secondary)]">
                {user?.bio || "No company description added yet."}
              </p>
            </div>

          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-8">

            <Info
              icon={<Building2 size={18}/>}
              label="Company"
              value={user?.company}
            />

            <Info
              icon={<User size={18}/>}
              label="Contact Person"
              value={user?.username}
            />

            <Info
              icon={<Mail size={18}/>}
              label="Email"
              value={user?.email}
            />

            <Info
              icon={<Phone size={18}/>}
              label="Phone"
              value={user?.phone}
            />

            <Info
              icon={<MapPin size={18}/>}
              label="Location"
              value={user?.location}
            />

            <Info
              icon={<Globe size={18}/>}
              label="Website"
              value={user?.website}
            />

          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-10">

            <Stat
              title="Jobs Posted"
              value={user?.jobsPosted || 0}
            />

            <Stat
              title="Applications"
              value={user?.applications || 0}
            />

            <Stat
              title="Industry"
              value={user?.industry || "Not set"}
            />

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

const Stat = ({ title, value }) => (
  <div className="bg-[var(--bg-primary)] rounded-xl p-6 border border-[var(--border-color)] text-center">

    <Briefcase className="mx-auto text-cyan-400 mb-3"/>

    <h3 className="text-sm text-[var(--text-secondary)]">
      {title}
    </h3>

    <p className="text-2xl font-bold mt-2">
      {value}
    </p>

  </div>
);

export default ClientProfile;