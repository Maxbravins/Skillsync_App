import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!email) {
    navigate("/forgot-password", { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedOtp = otp.trim();

    if (!/^\d{6}$/.test(trimmedOtp)) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/verify-otp", {
        email,
        otp: trimmedOtp,
      });

      const resetToken = response.data?.resetToken;

      if (!resetToken) {
        throw new Error("Reset token was not returned.");
      }

      navigate("/reset-password", {
        state: {
          email,
          resetToken,
        },
        replace: true,
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Invalid or expired OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-2">
        Verify OTP
      </h2>

      <p className="text-slate-400 mb-2">
        Enter the OTP sent to
      </p>

      <p className="text-cyan-400 mb-6 font-semibold break-all">
        {email}
      </p>

      {error && (
        <div
          role="alert"
          className="bg-red-500/20 border border-red-500/30 text-red-400 p-3 rounded-lg mb-4"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label
          htmlFor="otp"
          className="block text-sm font-medium text-slate-300 mb-2"
        >
          One-Time Password
        </label>

        <input
          id="otp"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="Enter 6-digit OTP"
          value={otp}
          onChange={(e) =>
            setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white tracking-[0.35em] text-center focus:outline-none focus:ring-2 focus:ring-cyan-500"
          maxLength={6}
          required
        />

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full mt-4 bg-cyan-500 hover:bg-cyan-600 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => navigate("/forgot-password")}
        className="w-full mt-4 text-sm text-cyan-400 hover:text-cyan-300 transition"
      >
        Back to Forgot Password
      </button>
    </div>
  );
};

export default VerifyOTP;
