import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getClientApplications,
  updateApplicationStatus,
} from "../../services/application.service";

import { initiatePayment } from "../../services/mpesa.service";

const JobApplicants = () => {
  const { status = "all" } = useParams();

  const [applications, setApplications] = useState([]);
  const [paymentModal, setPaymentModal] = useState({
    open: false,
    applicationId: null,
  });
  const [paymentPhoneNumber, setPaymentPhoneNumber] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [status]);

  const fetchApplications = async () => {
    try {
      const data = await getClientApplications();
      setApplications(data.applications);
    } catch (error) {
      console.log(error);
    }
  };

  const handleStatus = async (applicationId, newStatus) => {
    try {
      await updateApplicationStatus(applicationId, newStatus);

      setApplications((prev) =>
        prev.map((app) =>
          app._id === applicationId ? { ...app, status: newStatus } : app,
        ),
      );
    } catch (error) {
      console.log(error);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    if (!paymentModal.applicationId || !paymentPhoneNumber.trim()) return;

    setPaymentLoading(true);

    try {
      const res = await initiatePayment(
        paymentModal.applicationId,
        paymentPhoneNumber.trim(),
      );

      alert(res.message || "STK push sent successfully.");
      setPaymentModal({ open: false, applicationId: null });
      setPaymentPhoneNumber("");
      fetchApplications();
    } catch (error) {
      alert(error.response?.data?.message || "Payment initiation failed.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (status === "all") return true;
    return app.status === status;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          {status === "all"
            ? "All Applications"
            : `${status.charAt(0).toUpperCase() + status.slice(1)} Applications`}
        </h1>

        {filteredApplications.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center text-slate-400">
            No applications found.
          </div>
        ) : (
          filteredApplications.map((application) => (
            <div
              key={application._id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6 hover:border-cyan-500 transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">
                    {application.developer?.username}
                  </h2>

                  <p className="text-slate-400">
                    {application.developer?.email}
                  </p>

                  <p className="text-lg font-semibold text-cyan-400 mt-2">
                    {application.job?.title}
                  </p>

                  <p className="text-slate-400">
                    Budget: KES {application.job?.budget}
                  </p>

                  <p className="text-sm text-slate-500 mt-2">
                    Applied{" "}
                    {new Date(application.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <span
                  className={`px-4 py-1 rounded-full text-sm font-semibold
                    ${
                      application.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : application.status === "accepted"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                    }`}
                >
                  {application.status}
                </span>
              </div>

              <hr className="border-slate-800 my-5" />

              <h3 className="font-semibold mb-2">Cover Letter</h3>

              <p className="text-slate-300 leading-relaxed">
                {application.coverLetter}
              </p>

              {application.status === "pending" && (
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => handleStatus(application._id, "accepted")}
                    className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded-lg"
                  >
                    Accept
                  </button>

                  <button
                    onClick={() => handleStatus(application._id, "rejected")}
                    className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-lg"
                  >
                    Reject
                  </button>
                </div>
              )}

              {application.status === "accepted" &&
                application.paymentStatus !== "paid" && (
                  <button
                    onClick={() =>
                      setPaymentModal({
                        open: true,
                        applicationId: application._id,
                      })
                    }
                    className="mt-6 bg-cyan-600 hover:bg-cyan-700 px-5 py-2 rounded-lg font-semibold"
                  >
                    Pay Developer
                  </button>
                )}

              {application.paymentStatus === "paid" && (
                <div className="mt-6 text-green-400 font-semibold">
                  Developer Paid
                </div>
              )}

              {application.paymentStatus === "pending" && (
                <div className="mt-6 text-yellow-400 font-semibold">
                  Payment pending approval
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {paymentModal.open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-2">Pay Developer</h2>
            <p className="text-sm text-slate-400 mb-4">
              Enter the client&apos;s M-Pesa number to send the STK push.
            </p>

            <form onSubmit={handlePayment} className="space-y-4">
              <input
                type="tel"
                inputMode="tel"
                value={paymentPhoneNumber}
                onChange={(e) => setPaymentPhoneNumber(e.target.value)}
                placeholder="0712345678"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                required
              />

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={paymentLoading}
                  className="flex-1 rounded-lg bg-cyan-600 px-4 py-2 font-semibold hover:bg-cyan-700 disabled:opacity-60"
                >
                  {paymentLoading ? "Sending..." : "Send STK Push"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentModal({ open: false, applicationId: null });
                    setPaymentPhoneNumber("");
                  }}
                  className="flex-1 rounded-lg border border-slate-600 px-4 py-2 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobApplicants;
