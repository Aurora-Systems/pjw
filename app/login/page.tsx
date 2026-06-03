"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Button from "../components/Button";
import { api, setToken, ApiError } from "../lib/api";
import { inputClass } from "../components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.includes("@")) return setError("Enter a valid email.");
    setBusy(true);
    try {
      await api.requestOtp(email.trim().toLowerCase());
      setStep("code");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send the code.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otp) return setError("Enter the 6-digit code.");
    setBusy(true);
    try {
      const { token } = await api.verifyOtp({ email: email.trim().toLowerCase(), otp: otp.trim() });
      setToken(token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid code.");
    } finally {
      setBusy(false);
    }
  };

  const devLogin = async () => {
    setError(null);
    if (!email.includes("@")) return setError("Enter an email for the dev shortcut.");
    setBusy(true);
    try {
      const { token } = await api.devLogin({ email: email.trim().toLowerCase() });
      setToken(token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Dev login failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-8 group">
            <Image src="/pocket_jobs_logo.png" alt="PocketJobs" width={40} height={40} className="rounded-lg transition-transform duration-300 group-hover:scale-110" />
            <span className="text-2xl font-bold text-pj-slate-900 tracking-tight">
              Pocket<span className="text-pj-blue-600">Jobs</span>
            </span>
          </Link>

          <h2 className="text-3xl font-extrabold text-pj-slate-900 tracking-tight mb-2">Welcome back</h2>
          <p className="text-pj-slate-500 mb-8">
            {step === "email" ? "Sign in with a one-time code — no password needed." : `Enter the code we emailed to ${email}.`}
          </p>

          {step === "email" ? (
            <form onSubmit={sendCode} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-pj-slate-700 mb-2">Email address</label>
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>
                {busy ? "Sending…" : "Email me a code"}
              </Button>
              <button type="button" onClick={devLogin} disabled={busy} className="w-full text-sm font-semibold text-pj-slate-500 hover:text-pj-blue-600 transition cursor-pointer">
                Dev sign-in (skip OTP)
              </button>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-semibold text-pj-slate-700 mb-2">6-digit code</label>
                <input id="otp" inputMode="numeric" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value)} className={`${inputClass} tracking-[0.5em] text-center text-lg`} placeholder="000000" />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>
                {busy ? "Verifying…" : "Verify & continue"}
              </Button>
              <button type="button" onClick={() => { setStep("email"); setOtp(""); setError(null); }} className="w-full text-sm font-semibold text-pj-slate-500 hover:text-pj-blue-600 transition cursor-pointer">
                Use a different email
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-pj-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-pj-blue-600 hover:text-pj-blue-700 hover:underline transition">Sign Up</Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 gradient-blue relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/[0.03] rounded-full -translate-y-1/4 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/[0.03] rounded-full translate-y-1/4 -translate-x-1/4" />
        </div>
        <div className="relative text-center max-w-lg z-10">
          <h3 className="text-4xl font-extrabold text-white tracking-tight mb-4 leading-tight">Hire trusted hands, fast.</h3>
          <p className="text-blue-100 text-lg leading-relaxed">
            Browse verified providers, post a job, compare bids and book — all in one place.
          </p>
        </div>
      </div>
    </div>
  );
}
