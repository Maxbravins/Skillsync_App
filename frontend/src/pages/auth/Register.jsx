import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { registerUser } from "../../services/auth.service";

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // 

  const searchParams = new URLSearchParams(location.search);

  const requestedRole = searchParams.get("role");
  const redirectPath = searchParams.get("redirect");

  /*
   * Only accept roles that users are actually allowed
   * to select during registration.
   */
  const initialRole =
    requestedRole === "client" || requestedRole === "developer"
      ? requestedRole
      : "developer";

  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: initialRole,
    category: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  /*
   * Load categories only when needed.
   */
  useEffect(() => {
    if (formData.role === "developer") {
      fetchCategories();
    }
  }, [formData.role]);

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:5000/api/categories",
      );

      setCategories(data.categories || data || []);
    } catch (error) {
      console.log(error);
      setCategories([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: value,

      /*
       * A client doesn't need a developer specialization.
       */
      ...(name === "role" && value === "client"
        ? { category: "" }
        : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMsg("");
    setSuccessMsg("");

    /*
     * Developers must select a specialization.
     */
    if (formData.role === "developer" && !formData.category) {
      setErrorMsg("Please select your specialization.");
      return;
    }

    setLoading(true);

    try {
      await registerUser(formData);

      setSuccessMsg(
        "Registration successful! Redirecting to login...",
      );

      setTimeout(() => {
        const loginUrl = redirectPath
          ? `/login?redirect=${encodeURIComponent(redirectPath)}`
          : "/login";

        navigate(loginUrl, {
          replace: true,
        });
      }, 1200);
    } catch (error) {
      setErrorMsg(
        error.response?.data?.message ||
          "Registration failed. Please try again.",
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

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-8 rounded-2xl shadow-2xl relative z-10">

        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="SkillSync Logo"
            className="h-14 w-14 rounded-xl object-cover mx-auto mb-4 ring-4 ring-cyan-500/20"
          />

          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            Create your account
          </h1>

          <p className="text-slate-400 text-sm mt-2">
            Join SkillSync and start connecting
          </p>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="mb-5 p-4 rounded-lg bg-red-950/40 border border-red-800/50 text-red-200 text-sm">
            {errorMsg}
          </div>
        )}

        {/* Success */}
        {successMsg && (
          <div className="mb-5 p-4 rounded-lg bg-green-950/40 border border-green-800/50 text-green-200 text-sm">
            {successMsg}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-slate-300 text-sm font-semibold mb-2"
            >
              Username
            </label>

            <input
              id="username"
              type="text"
              name="username"
              placeholder="Your username"
              required
              autoComplete="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-slate-300 text-sm font-semibold mb-2"
            >
              Email address
            </label>

            <input
              id="email"
              type="email"
              name="email"
              placeholder="name@company.com"
              required
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-slate-300 text-sm font-semibold mb-2"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              name="password"
              placeholder="Create a password"
              required
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition"
            />
          </div>

          {/* Account Type */}
          <div>
            <label
              htmlFor="role"
              className="block text-slate-300 text-sm font-semibold mb-2"
            >
              I want to
            </label>

            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition"
            >
              <option value="developer">
                Find freelance work
              </option>

              <option value="client">
                Hire skilled professionals
              </option>
            </select>
          </div>

          {/* Developer Category */}
          {formData.role === "developer" && (
            <div>
              <label
                htmlFor="category"
                className="block text-slate-300 text-sm font-semibold mb-2"
              >
                Specialization
              </label>

              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition"
              >
                <option value="">
                  Select your specialization
                </option>

                {categories.map((category) => (
                  <option
                    key={category._id}
                    value={category._id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>

              {categories.length === 0 && (
                <p className="text-xs text-slate-500 mt-2">
                  Unable to load specializations. You can still try again
                  later.
                </p>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white p-3 rounded-lg font-bold transition shadow-lg shadow-cyan-950/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        {/* Login */}
        <p className="text-center text-slate-400 mt-6 text-sm">
          Already have an account?

          <Link
            to={
              redirectPath
                ? `/login?redirect=${encodeURIComponent(redirectPath)}`
                : "/login"
            }
            className="text-cyan-400 hover:text-cyan-300 ml-2 font-medium"
          >
            Sign in
          </Link>
        </p>

        {/* Marketplace */}
        <div className="mt-5 text-center">
          <Link
            to="/"
            className="text-xs text-slate-500 hover:text-cyan-400 transition"
          >
            ← Back to SkillSync marketplace
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
