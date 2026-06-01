"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Button from "../components/Button";

export default function SignupPage() {
  const [role, setRole] = useState<"client" | "freelancer">("freelancer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      alert("Please agree to the Terms of Service & Privacy Policy.");
      return;
    }
    // UI placeholder only
    alert(
      `Signup attempted for: ${fullName} (${email}) as a ${role}\n(This is a UI placeholder)`
    );
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left panel: Signup Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2.5 mb-8 group">
            <Image
              src="/logo.svg"
              alt="PocketJobs Logo"
              width={40}
              height={40}
              className="transition-transform duration-300 group-hover:scale-110"
            />
            <span className="text-2xl font-bold text-pj-slate-900 tracking-tight">
              Pocket<span className="text-pj-blue-600">Jobs</span>
            </span>
          </Link>

          <h2 className="text-3xl font-extrabold text-pj-slate-900 tracking-tight mb-2">
            Create your account
          </h2>
          <p className="text-pj-slate-500 mb-8">
            Join the PocketJobs community today.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Type Selector */}
            <div>
              <label className="block text-sm font-semibold text-pj-slate-700 mb-3">
                I want to:
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole("freelancer")}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 text-center transition-all duration-200 cursor-pointer ${
                    role === "freelancer"
                      ? "border-pj-blue-600 bg-pj-blue-50/50 text-pj-blue-700 font-semibold"
                      : "border-pj-slate-200 hover:border-pj-slate-300 text-pj-slate-600"
                  }`}
                >
                  <svg className={`w-8 h-8 mb-2 transition-colors duration-200 ${role === "freelancer" ? "text-pj-blue-600" : "text-pj-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25" />
                  </svg>
                  <span className="text-sm">Find Freelance Work</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("client")}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 text-center transition-all duration-200 cursor-pointer ${
                    role === "client"
                      ? "border-pj-blue-600 bg-pj-blue-50/50 text-pj-blue-700 font-semibold"
                      : "border-pj-slate-200 hover:border-pj-slate-300 text-pj-slate-600"
                  }`}
                >
                  <svg className={`w-8 h-8 mb-2 transition-colors duration-200 ${role === "client" ? "text-pj-blue-600" : "text-pj-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 .621-.504 1.125-1.125 1.125H4.875A1.125 1.125 0 0 1 3.75 18.4V14.15m16.5 0c.261 0 .513-.09.713-.257a1.125 1.125 0 0 0 .412-.866V9.378c0-.621-.504-1.125-1.125-1.125h-14.25c-.621 0-1.125.504-1.125 1.125v3.65c0 .324.14.633.387.85l.775.68a1.125 1.125 0 0 0 .738.27h14.25ZM12 8.25a2.25 2.25 0 0 0-2.25-2.25V4.5A2.25 2.25 0 0 1 12 2.25h0a2.25 2.25 0 0 1 2.25 2.25V6a2.25 2.25 0 0 0-2.25 2.25Z" />
                  </svg>
                  <span className="text-sm">Hire Talented Experts</span>
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label
                htmlFor="full-name"
                className="block text-sm font-semibold text-pj-slate-700 mb-2"
              >
                Full Name
              </label>
              <input
                id="full-name"
                name="full-name"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-pj-slate-200 text-pj-slate-900 placeholder:text-pj-slate-400 focus:outline-none focus:ring-2 focus:ring-pj-blue-500 focus:border-pj-blue-500 transition-all duration-200"
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-pj-slate-700 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-pj-slate-200 text-pj-slate-900 placeholder:text-pj-slate-400 focus:outline-none focus:ring-2 focus:ring-pj-blue-500 focus:border-pj-blue-500 transition-all duration-200"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-pj-slate-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-pj-slate-200 text-pj-slate-900 placeholder:text-pj-slate-400 focus:outline-none focus:ring-2 focus:ring-pj-blue-500 focus:border-pj-blue-500 transition-all duration-200"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-pj-slate-400 hover:text-pj-slate-600 cursor-pointer"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815 3.15 3.15m-3.15-3.15-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start">
              <input
                id="agree-terms"
                name="agree-terms"
                type="checkbox"
                required
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 h-4.5 w-4.5 rounded border-pj-slate-300 text-pj-blue-600 focus:ring-pj-blue-500 cursor-pointer"
              />
              <label
                htmlFor="agree-terms"
                className="ml-2.5 block text-sm text-pj-slate-600 leading-normal select-none"
              >
                I agree to the{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Terms of Service placeholder");
                  }}
                  className="font-semibold text-pj-blue-600 hover:text-pj-blue-700 hover:underline"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Privacy Policy placeholder");
                  }}
                  className="font-semibold text-pj-blue-600 hover:text-pj-blue-700 hover:underline"
                >
                  Privacy Policy
                </a>
                .
              </label>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full">
              Create Account
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-pj-slate-100" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-pj-slate-400 font-medium">
                Or sign up with
              </span>
            </div>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => alert("Google Signup (UI placeholder)")}
              className="flex justify-center items-center gap-2 px-4 py-3 rounded-xl border border-pj-slate-200 bg-white text-pj-slate-700 font-semibold hover:bg-pj-slate-50 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.466 0-6.277-2.85-6.277-6.36 0-3.51 2.811-6.358 6.277-6.358 1.583 0 3.023.59 4.137 1.558l3.1-3.15C19.23 2.378 15.933 1.2 12.24 1.2 6.033 1.2 1 6.236 1 12.44s5.033 11.24 11.24 11.24c6.48 0 10.74-4.56 10.74-10.92 0-.67-.06-1.32-.172-1.956H12.24Z"
                />
              </svg>
              Google
            </button>
            <button
              onClick={() => alert("GitHub Signup (UI placeholder)")}
              className="flex justify-center items-center gap-2 px-4 py-3 rounded-xl border border-pj-slate-200 bg-white text-pj-slate-700 font-semibold hover:bg-pj-slate-50 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </button>
          </div>

          {/* Toggle Screen */}
          <p className="mt-8 text-center text-sm text-pj-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-pj-blue-600 hover:text-pj-blue-700 hover:underline transition-colors"
            >
              Log In
            </Link>
          </p>
        </div>
      </div>

      {/* Right panel: Brand Graphic */}
      <div className="hidden lg:flex lg:w-1/2 gradient-blue relative items-center justify-center p-12 overflow-hidden">
        {/* Abstract circles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/[0.03] rounded-full -translate-y-1/4 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/[0.03] rounded-full translate-y-1/4 -translate-x-1/4" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/[0.05] rounded-full animate-pulse-soft" />
        </div>

        <div className="relative text-center max-w-lg z-10">
          <h3 className="text-4xl font-extrabold text-white tracking-tight mb-4 leading-tight">
            Start your freelance journey today.
          </h3>
          <p className="text-blue-100 text-lg mb-8 leading-relaxed">
            Gain access to high-quality projects, verify your payment terms, and
            work with trusted companies worldwide.
          </p>

          {/* Statistics card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-left">
            <h4 className="text-white font-bold text-lg mb-3">
              Why scale with PocketJobs?
            </h4>
            <ul className="space-y-2 text-white/90 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> 50k+ active freelancers in our roster
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Protected payments & escrow support
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Live dashboard tools to verify progress
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
