"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { getToken } from "../../lib/api";
import StoreBadges from "../../components/StoreBadges";

/** Role of whoever is signed in on this browser, from the token. A UI hint only, not a check. */
function readRole(): string | null {
  try {
    const t = getToken();
    if (!t) return null;
    return (JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) as { role?: string }).role ?? null;
  } catch {
    return null;
  }
}
const subscribe = () => () => {};

/**
 * What a visitor can do with a shared job. A signed-in provider goes straight to the offer
 * form for this job; anyone else is asked to sign in (and comes back to the same job after)
 * or to get the app.
 */
export default function JobCta({ jobId, open }: { jobId: string; open: boolean }) {
  // null on the server, the real role after hydration — without a mismatch warning.
  const role = useSyncExternalStore(subscribe, readRole, () => null);
  const offerPath = `/work?job=${jobId}`;

  if (!open) {
    return (
      <div className="mt-8 rounded-2xl border border-pj-slate-100 p-5 text-center">
        <p className="font-semibold text-pj-slate-900">This job has been filled or closed.</p>
        <p className="mt-1 text-sm text-pj-slate-500">There are more jobs like it on PocketJobs.</p>
        <Link
          href={role === "provider" ? "/work" : "/signup"}
          className="mt-4 inline-flex rounded-full bg-pj-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pj-blue-700"
        >
          {role === "provider" ? "See open jobs" : "Find work on PocketJobs"}
        </Link>
      </div>
    );
  }

  if (role === "provider") {
    return (
      <Link
        href={offerPath}
        className="mt-8 flex w-full items-center justify-center rounded-full bg-pj-blue-600 px-5 py-3.5 font-semibold text-white hover:bg-pj-blue-700"
      >
        Make an offer
      </Link>
    );
  }

  return (
    <div className="mt-8">
      <Link
        href={`/login?next=${encodeURIComponent(offerPath)}`}
        className="flex w-full items-center justify-center rounded-full bg-pj-blue-600 px-5 py-3.5 font-semibold text-white hover:bg-pj-blue-700"
      >
        Sign in to make an offer
      </Link>
      <p className="mt-3 text-center text-sm text-pj-slate-500">
        New to PocketJobs?{" "}
        <Link href="/signup" className="font-semibold text-pj-blue-600 hover:underline">
          Create a free account
        </Link>
      </p>
      <div className="mt-6 flex flex-col items-center gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-pj-slate-400">Or use the app</p>
        <StoreBadges className="justify-center" />
      </div>
    </div>
  );
}
