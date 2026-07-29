import useAuth from "../../hooks/useAuth";
import Navbar from "../../components/Navbar";
import { User, Mail, Shield } from "lucide-react";

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            My Profile
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            View your account details.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <div className="flex items-center gap-5 mb-8 pb-8 border-b border-slate-800">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 flex items-center justify-center text-2xl font-bold text-white shrink-0">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {user?.username}
              </h2>
              <p className="text-slate-400 text-sm capitalize">
                {user?.role}
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                <User className="text-cyan-400" size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Username
                </p>
                <p className="text-slate-200 font-medium">
                  {user?.username}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                <Mail className="text-cyan-400" size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Email
                </p>
                <p className="text-slate-200 font-medium">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                <Shield className="text-cyan-400" size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Role
                </p>
                <p className="text-slate-200 font-medium capitalize">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
