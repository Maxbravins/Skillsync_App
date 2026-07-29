import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await api.post("/auth/forgot-password", { email });
      setMessage(res.data.message);
      setEmail("");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-2">Forgot Password</h2>
      <p className="text-slate-400 mb-6">
        Enter your email to receive an OTP
      </p>

      {message && (
        <div className="bg-green-500/20 text-green-400 p-3 rounded-lg mb-4">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white mb-4"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-cyan-500 hover:bg-cyan-600 py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send OTP"}
        </button>
      </form>

      <p className="text-center text-slate-400 mt-4">
        <Link to="/login" className="text-cyan-400 hover:underline">
          Back to Login
        </Link>
      </p>
    </div>
  );
};

export default ForgotPassword;