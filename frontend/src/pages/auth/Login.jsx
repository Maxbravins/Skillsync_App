import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { loginUser } from "../../services/auth.service";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get("redirect");

  const getSafeRedirect = () => {
    if (!redirectPath) {
      return null;
    }

    const isSafe =
      redirectPath.startsWith("/") &&
      !redirectPath.startsWith("//");

    return isSafe ? redirectPath : null;
  };

  const getPostLoginDestination = (user) => {
    const safeRedirect = getSafeRedirect();

    /*
     * A developer can return to the requested page.
     */
    if (safeRedirect && user?.role === "developer") {
      return safeRedirect;
    }
// Clients should go to their dashboard after login.
    if (user?.role === "client") {
      if (
        safeRedirect === "/create-job" ||
        safeRedirect?.startsWith("/create-job")
      ) {
        return safeRedirect;
      }

      return "/client-dashboard";
    }

    /*
     * Admin users always go to the admin dashboard.
     */
    if (user?.role === "admin") {
      return "/admin-dashboard";
    }

    /*
     * Normal role-based destination.
     */
    switch (user?.role) {
      case "client":
        return "/client-dashboard";

      case "developer":
        return "/developer-dashboard";

      default:
        return "/";
    }
  };

  const handleChange = (e) => {
    setFormData((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMsg("");
    setLoading(true);

    try {
      const data = await loginUser(formData);

      login(data.user, data.token);

      const destination = getPostLoginDestination(data.user);

      navigate(destination, {
        replace: true,
      });
    } catch (error) {
      setErrorMsg(
        error.response?.data?.message ||
          t("loginFailed")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -top-20 -left-20 pointer-events-none" />

      <div className="absolute w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -bottom-20 -right-20 pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 p-8 rounded-2xl shadow-2xl relative z-10">

        {/* Logo / Header */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo.png"
            alt="SkillSync Logo"
            className="h-14 w-14 rounded-xl object-cover mb-4 ring-4 ring-cyan-500/20"
          />

          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent tracking-wide">
            {t("welcomeBack")}
          </h1>

          <p className="text-slate-400 text-sm mt-2">
            {t("welcomeSubtitle")}
          </p>
        </div>

        {/* Redirect Notice */}
        {redirectPath && (
          <div className="mb-6 p-4 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-cyan-200 text-sm text-center">
            Sign in to continue where you left off.
          </div>
        )}

        {/* Error */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-800/50 text-red-200 text-sm text-center">
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Email */}
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
              autoComplete="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-all text-sm"
            />
          </div>

          {/* Password */}
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
              autoComplete="current-password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-all text-sm"
            />
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm text-cyan-400 hover:text-cyan-300 transition"
            >
              {t("forgotPassword")}
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 rounded-lg transition-all shadow-md shadow-cyan-950/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              t("signIn")
            )}
          </button>
        </form>

        {/* Register */}
        <div className="mt-8 text-center border-t border-slate-800/80 pt-6">
          <p className="text-slate-400 text-sm">
            {t("dontHaveAccount")}{" "}

            <Link
              to={
                redirectPath
                  ? `/register?redirect=${encodeURIComponent(
                      redirectPath
                    )}`
                  : "/register"
              }
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              {t("signUp")}
            </Link>
          </p>
        </div>

        {/* Public Marketplace */}
        <div className="mt-5 text-center">
          <Link
            to="/"
            className="text-xs text-slate-500 hover:text-cyan-400 transition"
          >
            ← Back to SkillSync marketplace
          </Link>
        </div>

        {/* Browse Jobs */}
        <div className="mt-3 text-center">
          <Link
            to="/jobs"
            className="text-xs text-slate-500 hover:text-cyan-400 transition"
          >
            Browse jobs without signing in →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
