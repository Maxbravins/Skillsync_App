import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import api from "../../services/api";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const resetToken = location.state?.resetToken;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Redirect if user opens this page directly
  useEffect(() => {
    if (!resetToken) {
      navigate("/forgot-password", { replace: true });
    }
  }, [resetToken, navigate]);

  if (!resetToken) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (password !== confirmPassword) {
      setError(t("passwordsDoNotMatch"));
      return;
    }

    if (password.length < 6) {
      setError(t("passwordTooShort"));
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/reset-password", {
        resetToken,
        newPassword: password,
      });

      setSuccess(true);

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || t("resetPasswordFailed"));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-slate-900 p-8 rounded-xl shadow-lg text-center">
        <h2 className="text-2xl font-bold text-green-400 mb-4">
          {t("passwordResetSuccessful")}
        </h2>

        <p className="text-slate-300">{t("passwordResetSuccessMessage")}</p>

        <p className="text-slate-400 mt-3">{t("redirectingToLogin")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-slate-900 p-8 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-2">
        {t("resetPasswordTitle")}
      </h2>

      <p className="text-slate-400 mb-6">{t("resetPasswordSubtitle")}</p>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder={t("newPassword")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          required
        />

        <input
          type="password"
          placeholder={t("confirmNewPassword")}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white mb-6 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
        >
          {loading ? t("resettingPassword") : t("resetPasswordTitle")}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
