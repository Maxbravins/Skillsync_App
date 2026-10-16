import { useEffect, useRef, useState } from "react";
import { getTransactionStatus } from "../services/mpesa.service";

const terminalStatuses = new Set([
  "completed",
  "failed",
  "cancelled",
  "review_required",
]);

const messages = {
  pending: "Waiting for you to approve the M-Pesa prompt on your phone…",
  processing: "M-Pesa is processing your payment…",
  completed: "Payment confirmed by M-Pesa.",
  failed: "M-Pesa did not complete the payment. You can try again.",
  cancelled: "The payment was cancelled.",
  review_required: "Payment needs a manual review. Please contact support.",
};

export default function MpesaPaymentStatus({ transactionId, onTerminal }) {
  const [payment, setPayment] = useState({ transactionId: "", status: "pending" });
  const [timedOutTransactionId, setTimedOutTransactionId] = useState("");
  const onTerminalRef = useRef(onTerminal);

  useEffect(() => {
    onTerminalRef.current = onTerminal;
  }, [onTerminal]);

  useEffect(() => {
    if (!transactionId) return undefined;

    let active = true;
    let timer;
    let notified = false;
    const deadline = Date.now() + 2 * 60 * 1000;

    const poll = async () => {
      try {
        const response = await getTransactionStatus(transactionId);
        const nextStatus = response?.transaction?.status;
        if (!active || !nextStatus) return;

        setPayment({ transactionId, status: nextStatus });
        if (terminalStatuses.has(nextStatus)) {
          if (!notified) {
            notified = true;
            onTerminalRef.current?.(nextStatus);
          }
          return;
        }
      } catch (error) {
        // Keep polling through brief network interruptions; the server
        // remains the source of truth for whether payment succeeded.
        if (!active) return;
        console.warn("Unable to refresh M-Pesa status:", error);
      }

      if (!active) return;
      if (Date.now() >= deadline) {
        setTimedOutTransactionId(transactionId);
        return;
      }
      timer = window.setTimeout(poll, 3000);
    };

    poll();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [transactionId]);

  if (!transactionId) return null;
  const status = payment.transactionId === transactionId ? payment.status : "pending";
  const timedOut = timedOutTransactionId === transactionId;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 text-sm"
    >
      <p className="font-semibold capitalize">Payment: {status.replaceAll("_", " ")}</p>
      <p className="mt-1 text-[var(--text-secondary)]">
        {messages[status] || "Checking payment status with M-Pesa…"}
      </p>
      {timedOut && !terminalStatuses.has(status) && (
        <p className="mt-2 text-amber-400">
          Still awaiting confirmation. You can close this window and check your payment history later.
        </p>
      )}
    </div>
  );
}
