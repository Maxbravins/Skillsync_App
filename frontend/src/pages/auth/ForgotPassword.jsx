import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import api from "../../services/api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const res = await api.post("/auth/forgot-password", { email });

      // Navigate to Verify OTP page and pass the email
      navigate("/verify-otp", {
        state: {
          email,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || t("somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-2">{t("forgotPasswordTitle")}</h2>

      <p className="text-slate-400 mb-6">{t("forgotPasswordSubtitle")}</p>

      {error && (
        <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder={t("emailAddress")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white mb-4"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-cyan-500 hover:bg-cyan-600 py-2 rounded-lg disabled:opacity-50 text-white"
        >
          {loading ? t("sendingOtp") : t("sendOtp")}
        </button>
      </form>

      <p className="text-center mt-4">
        <Link to="/login" className="text-cyan-400 hover:underline">
          {t("backToLogin")}
        </Link>
      </p>
    </div>
  );
};

export default ForgotPassword;
