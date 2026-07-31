import { useState } from "react";
import { useParams } from "react-router-dom";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import { initiatePayment } from "../../services/mpesa.service";

const Payment = () => {
  const { applicationId } = useParams();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePayment = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const normalizedPhone = phoneNumber.trim();
      const res = await initiatePayment(applicationId, normalizedPhone);

      alert(res.message || "STK push sent successfully.");

      setPhoneNumber("");
    } catch (error) {
      alert(error.response?.data?.message || "Payment failed.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Navbar />

      <main className="max-w-xl mx-auto py-16">
        <div className="bg-[var(--bg-secondary)] rounded-xl p-8 border border-[var(--border-color)]">
          <h1 className="text-3xl font-bold mb-8">Pay Developer</h1>

          <form onSubmit={handlePayment} className="space-y-6">
            <input
              type="tel"
              inputMode="tel"
              placeholder="0712345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full border rounded-lg p-3 bg-transparent"
              required
            />
            <p className="text-sm text-[var(--text-secondary)]">
              Enter your M-Pesa number in the format 0712345678 or 254712345678.
            </p>

            <button
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg py-3"
            >
              {loading ? "Sending STK..." : "Pay via M-Pesa"}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Payment;
