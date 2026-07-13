"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Button from "../components/Button";
import ResendOtp from "../components/ResendOtp";
import { api, setToken, ApiError } from "../lib/api";
import { inputClass } from "../components/ui";
import type { AccountType, UserRole } from "../lib/types";

const ROLES: { value: UserRole; title: string; sub: string }[] = [
  { value: "customer", title: "Hire help", sub: "Book a provider or post a one-off job" },
  { value: "provider", title: "Find work", sub: "Offer your services and bid on jobs" },
  { value: "corporate", title: "Hire a team", sub: "Bulk workforce or freelancers" },
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "code">("details");
  const [role, setRole] = useState<UserRole>("customer");
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName) return setError("Enter your name.");
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
      const { token } = await api.verifyOtp({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        role,
        full_name: fullName,
        account_type: role === "corporate" ? accountType : undefined,
        signup: true,
      });
      setToken(token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid code.");
    } finally {
      setBusy(false);
    }
  };

  // --- Dev sign-up (skip OTP) — disabled for now ---
  // const devSignup = async () => {
  //   setError(null);
  //   if (!fullName || !email.includes("@")) return setError("Enter your name and a valid email.");
  //   setBusy(true);
  //   try {
  //     const { token } = await api.devLogin({
  //       email: email.trim().toLowerCase(),
  //       role,
  //       full_name: fullName,
  //       account_type: role === "corporate" ? accountType : undefined,
  //     });
  //     setToken(token);
  //     router.push("/dashboard");
  //   } catch (err) {
  //     setError(err instanceof ApiError ? err.message : "Dev signup failed.");
  //   } finally {
  //     setBusy(false);
  //   }
  // };

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

          <h2 className="text-3xl font-extrabold text-pj-slate-900 tracking-tight mb-2">Create your account</h2>
          <p className="text-pj-slate-500 mb-8">
            {step === "details" ? "Join PocketJobs — we'll email you a one-time code." : `Enter the code we emailed to ${email}.`}
          </p>

          {step === "details" ? (
            <form onSubmit={sendCode} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-pj-slate-700 mb-3">I want to:</label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`rounded-xl border p-3 text-left transition ${role === r.value ? "border-pj-blue-600 bg-pj-blue-50" : "border-pj-slate-200 hover:border-pj-slate-300"}`}
                    >
                      <div className="text-sm font-bold text-pj-slate-900">{r.title}</div>
                      <div className="text-[11px] text-pj-slate-500 mt-0.5 leading-tight">{r.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {role === "corporate" && (
                <div>
                  <label className="block text-sm font-semibold text-pj-slate-700 mb-2">Are you hiring as…</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["individual", "company"] as AccountType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setAccountType(t)}
                        className={`rounded-xl border px-4 py-2.5 text-sm font-semibold capitalize transition ${accountType === t ? "border-pj-blue-600 bg-pj-blue-50 text-pj-blue-700" : "border-pj-slate-200 text-pj-slate-600 hover:border-pj-slate-300"}`}
                      >
                        {t === "individual" ? "An individual" : "A company"}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-pj-slate-400 mt-2">
                    Individuals can post jobs right away. Companies can add verification later for invoicing.
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-pj-slate-700 mb-2">Full name</label>
                <input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="Rumbi Chideya" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-pj-slate-700 mb-2">Email address</label>
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>
                {busy ? "Sending…" : "Email me a code"}
              </Button>
              {/* Dev sign-up + Google OAuth are disabled for now. */}
              {/*
              <button type="button" onClick={devSignup} disabled={busy} className="w-full text-sm font-semibold text-pj-slate-500 hover:text-pj-blue-600 transition cursor-pointer">
                Dev sign-up (skip OTP)
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="h-px flex-1 bg-pj-slate-100" />
                <span className="text-xs text-pj-slate-400">or</span>
                <div className="h-px flex-1 bg-pj-slate-100" />
              </div>
              <button
                type="button"
                onClick={() => { window.location.href = `/api/auth/google/start?role=${role}`; }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-pj-slate-200 bg-white text-pj-slate-700 font-semibold hover:bg-pj-slate-50 transition cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.466 0-6.277-2.85-6.277-6.36 0-3.51 2.811-6.358 6.277-6.358 1.583 0 3.023.59 4.137 1.558l3.1-3.15C19.23 2.378 15.933 1.2 12.24 1.2 6.033 1.2 1 6.236 1 12.44s5.033 11.24 11.24 11.24c6.48 0 10.74-4.56 10.74-10.92 0-.67-.06-1.32-.172-1.956H12.24Z" /></svg>
                Continue with Google
              </button>
              */}
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-semibold text-pj-slate-700 mb-2">6-digit code</label>
                <input id="otp" inputMode="numeric" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value)} className={`${inputClass} tracking-[0.5em] text-center text-lg`} placeholder="000000" />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>
                {busy ? "Verifying…" : "Verify & create account"}
              </Button>
              <ResendOtp email={email} onError={setError} onResent={() => setOtp("")} />
              <button type="button" onClick={() => { setStep("details"); setOtp(""); setError(null); }} className="w-full text-sm font-semibold text-pj-slate-500 hover:text-pj-blue-600 transition cursor-pointer">
                Back
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-pj-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-pj-blue-600 hover:text-pj-blue-700 hover:underline transition">Log In</Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 gradient-blue relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/[0.03] rounded-full -translate-y-1/4 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/[0.03] rounded-full translate-y-1/4 -translate-x-1/4" />
        </div>
        <div className="relative text-center max-w-lg z-10">
          <h3 className="text-4xl font-extrabold text-white tracking-tight mb-4 leading-tight">Work that fits your life.</h3>
          <p className="text-blue-100 text-lg leading-relaxed">
            Whether you&apos;re hiring trusted hands or offering your skills — get started in minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
