"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";

/**
 * "Resend code" control for the OTP step of /login and /signup.
 *
 * Codes expire, and the verify endpoint cannot tell an expired code from a wrong one
 * (Neon Auth returns the same failure, surfaced as "Invalid or expired code"), so the
 * resend is always offered on the code step rather than being gated on a specific error.
 *
 * The send endpoint is rate-limited to 5 per email / 10 min (app/api/auth/otp/request),
 * so we hold a cooldown between sends — otherwise a user tapping "resend" locks
 * themselves out with a 429.
 */
const COOLDOWN_SECONDS = 60;

export default function ResendOtp({
  email,
  onError,
  onResent,
}: {
  email: string;
  /** Lets the parent page show the failure in its existing error slot. */
  onError?: (message: string | null) => void;
  /** Fired after a new code is sent — the parent clears the now-stale code input. */
  onResent?: () => void;
}) {
  // A code was just sent to get here, so start in cooldown.
  const [secondsLeft, setSecondsLeft] = useState(COOLDOWN_SECONDS);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const resend = async () => {
    if (busy || secondsLeft > 0) return;
    setBusy(true);
    setSent(false);
    onError?.(null);
    try {
      await api.requestOtp(email.trim().toLowerCase());
      setSent(true);
      setSecondsLeft(COOLDOWN_SECONDS);
      onResent?.(); // the previously-typed code is now stale

    } catch (err) {
      // Includes the 429 ("Too many requests…") if they've burned the send budget.
      onError?.(err instanceof ApiError ? err.message : "Could not resend the code.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="text-center text-sm">
      {sent && (
        <p className="mb-1 font-medium text-emerald-700" role="status" aria-live="polite">
          New code sent to {email}.
        </p>
      )}
      <p className="text-pj-slate-500">
        Didn&apos;t get the code?{" "}
        {secondsLeft > 0 ? (
          <span className="text-pj-slate-500">
            Resend in <span className="font-semibold tabular-nums">{secondsLeft}s</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={resend}
            disabled={busy}
            className="font-semibold text-pj-blue-600 transition hover:text-pj-blue-700 hover:underline cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Sending…" : "Resend code"}
          </button>
        )}
      </p>
    </div>
  );
}
