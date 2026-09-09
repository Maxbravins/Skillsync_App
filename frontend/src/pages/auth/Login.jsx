import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { loginUser } from "../../services/auth.service";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
          "Login failed. Please check your credentials."
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
            Welcome back
          </h1>

          <p className="text-slate-400 text-sm mt-2">
            Sign in to your SkillSync account
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
              Email address
            </label>

            <div className="relative">
              {/* User Icon */}
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
              </div>

              <input
                type="email"
                id="email"
                name="email"
                required
                autoComplete="email"
                placeholder="name@company.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-all text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              className="block text-slate-300 text-sm font-semibold mb-2"
              htmlFor="password"
            >
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-4 pr-12 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-all text-sm"
              />

              {/* Show / Hide Password */}
              <button
                type="button"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors focus:outline-none"
              >
                {showPassword ? (
                  /* Eye Off */
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c1.495 0 2.91-.32 4.187-.896M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.774 3.162 10.066 7.5a10.523 10.523 0 0 1-4.293 5.323M6.228 6.228 3 3m3.228 3.228 3.087 3.087m0 0a3 3 0 1 0 4.243 4.243m0 0L21 21"
                    />
                  </svg>
                ) : (
                  /* Eye */
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 0 1 0-.644C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.01 9.964 7.178.07.21.07.434 0 .644C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.01-9.964-7.178Z"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm text-cyan-400 hover:text-cyan-300 transition"
            >
              Forgot Password
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
              "Sign In"
            )}
          </button>
        </form>

        {/* Register */}
        <div className="mt-8 text-center border-t border-slate-800/80 pt-6">
          <p className="text-slate-400 text-sm">
            Don't have an account?{" "}

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
              Sign Up
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
