"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Button from "./Button";
import { getToken } from "../lib/api";

const navLinks = [
  { label: "Find Work", href: "#categories" },
  { label: "Find Talent", href: "#how-it-works" },
  { label: "Why PocketJobs", href: "#why-pocketjobs" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!getToken());
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <nav
        id="main-navbar"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "glass-solid shadow-md border-b border-pj-slate-100"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 group"
              id="navbar-logo"
            >
              <Image
                src="/logo.svg"
                alt="PocketJobs Logo"
                width={36}
                height={36}
                className="transition-transform duration-300 group-hover:scale-110"
              />
              <span className="text-xl font-bold text-pj-slate-900 tracking-tight">
                Pocket<span className="text-pj-blue-600">Jobs</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-pj-slate-600 rounded-full hover:text-pj-blue-600 hover:bg-pj-blue-50 transition-all duration-200"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              {loggedIn ? (
                <Button variant="primary" size="sm" href="/dashboard" id="nav-dashboard-btn">
                  Go to dashboard
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" href="/login" id="nav-login-btn">
                    Log In
                  </Button>
                  <Button variant="primary" size="sm" href="/signup" id="nav-signup-btn">
                    Sign Up
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden flex flex-col items-center justify-center w-10 h-10 rounded-lg hover:bg-pj-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              <span
                className={`block w-5 h-0.5 bg-pj-slate-700 rounded-full transition-all duration-300 ${
                  mobileOpen ? "rotate-45 translate-y-1.5" : ""
                }`}
              />
              <span
                className={`block w-5 h-0.5 bg-pj-slate-700 rounded-full transition-all duration-300 mt-1 ${
                  mobileOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`block w-5 h-0.5 bg-pj-slate-700 rounded-full transition-all duration-300 mt-1 ${
                  mobileOpen ? "-rotate-45 -translate-y-1.5" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full pt-20 px-6 pb-8">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-base font-medium text-pj-slate-700 rounded-xl hover:text-pj-blue-600 hover:bg-pj-blue-50 transition-all duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-pj-slate-100 flex flex-col gap-3">
            {loggedIn ? (
              <Button variant="primary" size="lg" href="/dashboard" className="w-full" id="mobile-dashboard-btn">
                Go to dashboard
              </Button>
            ) : (
              <>
                <Button variant="outline" size="lg" href="/login" className="w-full" id="mobile-login-btn">
                  Log In
                </Button>
                <Button variant="primary" size="lg" href="/signup" className="w-full" id="mobile-signup-btn">
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
