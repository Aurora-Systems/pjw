"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

type State = "ask" | "busy" | "unsubscribed" | "resubscribed" | "error";

/**
 * Landing page for the "Unsubscribe from announcements" link in a mass email. It asks before
 * acting, because mail security scanners open every link in a message, and acting on the page
 * load would unsubscribe people who never tapped anything.
 */
export default function UnsubscribeClient() {
  const params = useSearchParams();
  const u = params.get("u");
  const t = params.get("t");
  const [state, setState] = useState<State>(u && t ? "ask" : "error");
  const [message, setMessage] = useState<string | null>(u && t ? null : "This link is incomplete.");

  const submit = async (action: "unsubscribe" | "resubscribe") => {
    setState("busy");
    try {
      const res = await fetch(`/api/email/unsubscribe?u=${encodeURIComponent(u ?? "")}&t=${encodeURIComponent(t ?? "")}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(body.error || "Something went wrong.");
      setState(action === "unsubscribe" ? "unsubscribed" : "resubscribed");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Something went wrong.");
      setState("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pj-slate-50 px-4 py-16">
      <div className="w-full max-w-md rounded-3xl bg-white border border-pj-slate-100 shadow-sm p-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <Image src="/pocket_jobs_logo.png" alt="" width={36} height={36} className="rounded-lg" />
          <span className="text-xl font-bold text-pj-slate-900 tracking-tight">
            Pocket<span className="text-pj-blue-600">Jobs</span>
          </span>
        </Link>

        {state === "ask" || state === "busy" ? (
          <>
            <h1 className="text-2xl font-bold text-pj-slate-900">Unsubscribe from announcements?</h1>
            <p className="mt-3 text-pj-slate-500 leading-relaxed">
              You&apos;ll stop getting news and updates from PocketJobs. Emails about your own jobs,
              offers, bookings and account will still reach you.
            </p>
            <button
              type="button"
              onClick={() => submit("unsubscribe")}
              disabled={state === "busy"}
              className="mt-7 w-full rounded-full bg-pj-blue-600 px-5 py-3 text-white font-semibold hover:bg-pj-blue-700 disabled:opacity-60 cursor-pointer"
            >
              {state === "busy" ? "Working…" : "Unsubscribe"}
            </button>
            <Link href="/" className="mt-3 inline-block text-sm font-semibold text-pj-slate-500 hover:text-pj-slate-800">
              Keep me subscribed
            </Link>
          </>
        ) : state === "unsubscribed" ? (
          <>
            <h1 className="text-2xl font-bold text-pj-slate-900">You&apos;re unsubscribed</h1>
            <p className="mt-3 text-pj-slate-500 leading-relaxed">
              We won&apos;t send you announcements any more. You&apos;ll still get emails about your own
              jobs and account.
            </p>
            <button
              type="button"
              onClick={() => submit("resubscribe")}
              className="mt-7 text-sm font-semibold text-pj-blue-600 hover:text-pj-blue-700 cursor-pointer"
            >
              Changed your mind? Subscribe again
            </button>
          </>
        ) : state === "resubscribed" ? (
          <>
            <h1 className="text-2xl font-bold text-pj-slate-900">You&apos;re subscribed again</h1>
            <p className="mt-3 text-pj-slate-500">Thanks for sticking with us.</p>
            <Link
              href="/"
              className="mt-7 inline-flex rounded-full bg-pj-blue-600 px-5 py-2.5 text-white font-semibold hover:bg-pj-blue-700"
            >
              Back to PocketJobs
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-pj-slate-900">That didn&apos;t work</h1>
            <p className="mt-3 text-pj-slate-500 leading-relaxed">
              {message} If it keeps happening,{" "}
              <Link href="/company/contact" className="text-pj-blue-600 font-semibold hover:underline">
                contact us
              </Link>{" "}
              and we&apos;ll unsubscribe you.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
