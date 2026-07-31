import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { registerUser } from "../../services/auth.service";

const Register = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "developer",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      await registerUser(formData);
      setSuccessMsg(t("registrationSuccess"));
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || t("registrationFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -top-20 -left-20 pointer-events-none"></div>
      <div className="absolute w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -bottom-20 -right-20 pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo.png"
            alt="SkillSync Logo"
            className="h-14 w-14 rounded-xl object-cover mb-4 ring-4 ring-cyan-500/20"
          />
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent tracking-wide">
            {t("getStarted")}
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            {t("createAccountSubtitle")}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-800/50 text-red-200 text-sm text-center">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-200 text-sm text-center">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              className="block text-slate-300 text-sm font-semibold mb-2"
              htmlFor="username"
            >
              {t("username")}
            </label>
            <input
              type="text"
              id="username"
              name="username"
              required
              placeholder="johndoe"
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-all text-sm"
            />
          </div>

          <div>
            <label
              className="block text-slate-300 text-sm font-semibold mb-2"
              htmlFor="email"
            >
              {t("emailAddress")}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              placeholder="name@company.com"
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-all text-sm"
            />
          </div>

          <div>
            <label
              className="block text-slate-300 text-sm font-semibold mb-2"
              htmlFor="password"
            >
              {t("password")}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              placeholder="••••••••"
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-all text-sm"
            />
          </div>

          <div>
            <label
              className="block text-slate-300 text-sm font-semibold mb-2"
              htmlFor="role"
            >
              I am a...
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-all text-sm cursor-pointer"
            >
              <option value="developer" className="bg-slate-950 text-slate-200">
                Developer (Looking for work)
              </option>
              <option value="client" className="bg-slate-950 text-slate-200">
                Client (Looking to hire)
              </option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 rounded-lg transition-all shadow-md shadow-cyan-950/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              t("signUp")
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-800/80 pt-6">
          <p className="text-slate-400 text-sm">
            {t("alreadyHaveAccount")}{" "}
            <Link
              to="/login"
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              {t("signIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
