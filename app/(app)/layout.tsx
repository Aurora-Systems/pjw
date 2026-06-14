"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../lib/auth-context";
import { getToken } from "../lib/api";
import { Spinner } from "../components/ui";
import type { UserRole } from "../lib/types";

const NAV: Record<UserRole, { href: string; label: string }[]> = {
  customer: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/browse", label: "Browse" },
    { href: "/post-job", label: "Post a job" },
    { href: "/jobs", label: "My jobs" },
    { href: "/bookings", label: "Bookings" },
  ],
  provider: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/work", label: "Find work" },
    { href: "/my-bids", label: "My bids" },
    { href: "/earnings", label: "Earnings" },
    { href: "/profile", label: "Profile" },
  ],
  corporate: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/hiring", label: "Hiring" },
    { href: "/hiring/new", label: "New request" },
  ],
  admin: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/admin", label: "Moderation" },
  ],
};

function Shell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user && !getToken()) {
      router.replace("/login");
      return;
    }
    // Providers must finish onboarding (trade + services) before using the app.
    if (user?.role === "provider" && !user.provider_onboarded && pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [loading, user, router, pathname]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const links = NAV[user.role];

  return (
    <div className="min-h-screen bg-pj-slate-50">
      <header className="sticky top-0 z-40 bg-white border-b border-pj-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image src="/pocket_jobs_logo.png" alt="PocketJobs" width={30} height={30} className="rounded-md" />
              <span className="text-lg font-bold text-pj-slate-900 tracking-tight hidden sm:inline">
                Pocket<span className="text-pj-blue-600">Jobs</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {links.map((l) => {
                const active = pathname === l.href || (l.href !== "/dashboard" && pathname.startsWith(l.href));
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`px-3 py-2 text-sm font-medium rounded-full transition ${active ? "text-pj-blue-700 bg-pj-blue-50" : "text-pj-slate-600 hover:text-pj-blue-600 hover:bg-pj-slate-50"}`}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-pj-slate-900 leading-tight">{user.full_name}</div>
              <div className="text-xs text-pj-slate-400 capitalize">{user.role}</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-pj-blue-600 text-white flex items-center justify-center text-sm font-bold">
              {user.full_name.slice(0, 2).toUpperCase()}
            </div>
            <button onClick={logout} className="text-sm font-semibold text-pj-slate-500 hover:text-red-600 transition cursor-pointer">
              Log out
            </button>
          </div>
        </div>
        {/* mobile nav */}
        <nav className="md:hidden flex items-center gap-1 overflow-x-auto px-4 pb-2">
          {links.map((l) => {
            const active = pathname === l.href || (l.href !== "/dashboard" && pathname.startsWith(l.href));
            return (
              <Link key={l.href} href={l.href} className={`whitespace-nowrap px-3 py-1.5 text-sm font-medium rounded-full ${active ? "text-pj-blue-700 bg-pj-blue-50" : "text-pj-slate-600"}`}>
                {l.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Shell>{children}</Shell>
    </AuthProvider>
  );
}
