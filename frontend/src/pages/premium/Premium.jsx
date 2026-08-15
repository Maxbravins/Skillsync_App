import { useState } from "react";
import Footer from "../../components/Footer";
import { payPremium } from "../../services/premium.service";

const Premium = () => {
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const plans = {
    monthly: {
      name: "Monthly Premium",
      price: 300,
      duration: "30 days",
    },

    yearly: {
      name: "Yearly Premium",
      price: 3000,
      duration: "365 days",
    },
  };

  const handlePayment = async () => {
    setMessage("");
    setError("");

    if (!phoneNumber.trim()) {
      setError("Please enter your M-Pesa phone number.");
      return;
    }

    try {
      setLoading(true);

      const data = await payPremium(
        selectedPlan,
        phoneNumber
      );

      setMessage(
        data.message ||
          "STK Push sent. Check your phone and enter your M-Pesa PIN."
      );

    } catch (error) {
      console.error("Premium payment error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to initiate Premium payment."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">

        {/* Header */}
        <div className="text-center mb-12">

          <div className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm font-semibold mb-4">
            ⭐ SkillSync Premium
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Unlock More With Premium
          </h1>

          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
            Get more visibility, better opportunities and
            additional features designed to help you succeed
            on SkillSync.
          </p>

        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">

          {Object.entries(plans).map(
            ([key, plan]) => {

              const selected =
                selectedPlan === key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setSelectedPlan(key)
                  }
                  className={`text-left p-6 rounded-2xl border transition ${
                    selected
                      ? "border-yellow-400 bg-yellow-500/10 shadow-lg shadow-yellow-500/10"
                      : "border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-yellow-500/50"
                  }`}
                >

                  <div className="flex justify-between items-start mb-5">

                    <div>
                      <h2 className="text-xl font-bold">
                        {plan.name}
                      </h2>

                      <p className="text-sm text-[var(--text-secondary)] mt-1">
                        {plan.duration}
                      </p>
                    </div>

                    {selected && (
                      <span className="text-yellow-400 text-xl">
                        ✓
                      </span>
                    )}

                  </div>

                  <div className="mb-5">

                    <span className="text-4xl font-bold">
                      KES{" "}
                      {plan.price.toLocaleString()}
                    </span>

                  </div>

                  <ul className="space-y-3 text-sm text-[var(--text-secondary)]">

                    <li>✓ Premium account badge</li>
                    <li>✓ Increased profile visibility</li>
                    <li>✓ Priority opportunities</li>
                    <li>✓ Premium features</li>

                  </ul>

                </button>
              );
            }
          )}

        </div>

        {/* Payment */}
        <div className="max-w-xl mx-auto mt-10">

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6">

            <h2 className="text-xl font-bold mb-2">
              Pay With M-Pesa
            </h2>

            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Enter your M-Pesa number. We'll send an
              STK Push to your phone.
            </p>

            {message && (
              <div className="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
                {message}
              </div>
            )}

            {error && (
              <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <label className="block text-sm font-medium mb-2">
              M-Pesa Phone Number
            </label>

            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) =>
                setPhoneNumber(e.target.value)
              }
              placeholder="0712345678"
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] outline-none focus:border-yellow-400 transition"
            />

            <button
              type="button"
              onClick={handlePayment}
              disabled={loading}
              className="w-full mt-4 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Sending STK Push..."
                : `Pay KES ${plans[selectedPlan].price.toLocaleString()}`}
            </button>

            <p className="text-xs text-center text-[var(--text-secondary)] mt-4">
              You will receive an M-Pesa payment prompt on
              your phone.
            </p>

          </div>

        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto mt-16">

          <h2 className="text-2xl font-bold text-center mb-8">
            Why Go Premium?
          </h2>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">

            <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <div className="text-2xl mb-3">🚀</div>
              <h3 className="font-semibold mb-1">
                More Visibility
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Stand out from other users.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <div className="text-2xl mb-3">⭐</div>
              <h3 className="font-semibold mb-1">
                Premium Badge
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Show that you are a Premium member.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <div className="text-2xl mb-3">🎯</div>
              <h3 className="font-semibold mb-1">
                Priority
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Get access to priority opportunities.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <div className="text-2xl mb-3">💼</div>
              <h3 className="font-semibold mb-1">
                Better Opportunities
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Improve your chances of finding work.
              </p>
            </div>

          </div>

        </div>

      </main>

      <Footer />

    </div>
  );
};

export default Premium;