import { useState } from "react";
import { useParams } from "react-router-dom";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import { FaMobileAlt, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { initiatePayment } from "../../services/mpesa.service";

const Payment = () => {
  const { applicationId } = useParams();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const normalizePhoneNumber = (phone) => {
    let phoneValue = phone.trim().replace(/\s+/g, "");

    if (phoneValue.startsWith("+254")) {
      phoneValue = phoneValue.substring(1);
    }

    if (phoneValue.startsWith("07")) {
      phoneValue = `254${phoneValue.substring(1)}`;
    }

    if (phoneValue.startsWith("01")) {
      phoneValue = `254${phoneValue.substring(1)}`;
    }

    return phoneValue;
  };

  const isValidKenyanPhone = (phone) => {
    return /^254(7|1)\d{8}$/.test(phone);
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    if (!isValidKenyanPhone(normalizedPhone)) {
      setError(
        "Please enter a valid Kenyan M-Pesa number, e.g. 0712345678."
      );
      return;
    }

    try {
      setLoading(true);

      const res = await initiatePayment(
        applicationId,
        normalizedPhone
      );

      setMessage(
        res.message ||
          "STK Push sent. Please check your phone and enter your M-Pesa PIN."
      );

      setPhoneNumber("");
    } catch (error) {
      console.error("Payment error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to initiate payment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Navbar />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-12 sm:py-16">

        <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 sm:p-8 border border-[var(--border-color)] shadow-lg">

          <div className="text-center mb-8">

            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
              <FaMobileAlt className="text-2xl text-green-400" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold">
              Pay Developer
            </h1>

            <p className="text-sm text-[var(--text-secondary)] mt-2">
              Complete your payment securely using M-Pesa.
            </p>

          </div>

          {message && (
            <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 flex items-start gap-3">
              <FaCheckCircle className="mt-1 shrink-0" />

              <p className="text-sm">
                {message}
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3">
              <FaExclamationCircle className="mt-1 shrink-0" />

              <p className="text-sm">
                {error}
              </p>
            </div>
          )}

          <form
            onSubmit={handlePayment}
            className="space-y-6"
          >

            <div>
              <label className="block text-sm font-medium mb-2">
                M-Pesa Phone Number
              </label>

              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="0712345678"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setError("");
                  setMessage("");
                }}
                disabled={loading}
                className="w-full border border-[var(--border-color)] rounded-lg p-3 bg-[var(--bg-primary)] outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                required
              />

              <p className="text-xs text-[var(--text-secondary)] mt-2">
                Accepted formats: 0712345678, 0112345678,
                254712345678 or +254712345678.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg py-3 font-semibold transition"
            >
              <FaMobileAlt />

              {loading
                ? "Sending STK Push..."
                : "Pay via M-Pesa"}
            </button>

          </form>

          <div className="mt-6 p-4 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]">
            <p className="text-sm font-semibold mb-1">
              How it works
            </p>

            <p className="text-xs text-[var(--text-secondary)]">
              Enter your M-Pesa number, click Pay, then check
              your phone for the M-Pesa STK prompt and enter
              your M-Pesa PIN.
            </p>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
};

export default Payment;
