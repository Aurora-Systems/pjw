"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Button from "../components/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // UI placeholder only
    alert(`Login attempted for: ${email}\n(This is a UI placeholder)`);
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left panel: Login Form */}
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
            Welcome back
          </h2>
          <p className="text-pj-slate-500 mb-8">
            Access your dashboard and start hiring or working.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div>
              <div className="flex justify-between items-center mb-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-pj-slate-700"
                >
                  Password
                </label>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Forgot password function (UI placeholder)");
                  }}
                  className="text-sm font-semibold text-pj-blue-600 hover:text-pj-blue-700 transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
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

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4.5 w-4.5 rounded border-pj-slate-300 text-pj-blue-600 focus:ring-pj-blue-500 cursor-pointer"
              />
              <label
                htmlFor="remember-me"
                className="ml-2.5 block text-sm font-medium text-pj-slate-600 cursor-pointer select-none"
              >
                Keep me logged in
              </label>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full">
              Log In
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-pj-slate-100" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-pj-slate-400 font-medium">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => alert("Google Login (UI placeholder)")}
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
              onClick={() => alert("GitHub Login (UI placeholder)")}
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
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-pj-blue-600 hover:text-pj-blue-700 hover:underline transition-colors"
            >
              Sign Up
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
            Find work you love, right in your pocket.
          </h3>
          <p className="text-blue-100 text-lg mb-8 leading-relaxed">
            Create your profile, showcase your skills, and apply to thousands of
            global opportunities that fit your lifestyle.
          </p>

          {/* Testimonial card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-left">
            <p className="text-white text-base leading-relaxed mb-4">
              &ldquo;PocketJobs gave me access to high-paying international clients
              without the stress of sourcing leads myself. Highly recommended!&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pj-blue-400 flex items-center justify-center font-bold text-white text-sm">
                SC
              </div>
              <div>
                <div className="text-white font-semibold text-sm">Sarah Chen</div>
                <div className="text-blue-200 text-xs">Senior Frontend Engineer</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
