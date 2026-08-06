"use client";

import { useEffect, useState } from "react";

/**
 * One-time guided walkthrough for the authenticated app, shown on a user's first visit.
 *
 * Role-aware: a provider is told where work, offers and the wallet live; a client is told how to
 * post a job and track it. Persisted in localStorage per role, so switching modes shows the tour
 * for the new mode once and then never again.
 */

type Step = { icon: React.ReactNode; title: string; body: string };

const icon = (d: string) => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const PLUS = "M12 4.5v15m7.5-7.5h-15";
const SEARCH = "m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z";
const CALENDAR = "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5";
const CHAT = "M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155";
const WALLET = "M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3";
const BRIEFCASE = "M20.25 14.15v4.073a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a9.797 9.797 0 0 1-5.396 0l-1.32-.377a2.25 2.25 0 0 1-1.632-2.163V14.15M16.5 6.087a48.554 48.554 0 0 0-9 0m9 0a2.25 2.25 0 0 1 2.25 2.25v1.5m-11.25-3.75a2.25 2.25 0 0 0-2.25 2.25v1.5m0 0a48.667 48.667 0 0 1 15 0";
const SWAP = "M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5";
const PERSON = "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z";
const SEND = "M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5";

const CUSTOMER_STEPS: Step[] = [
  { icon: icon(PLUS), title: "Post a job", body: "Describe what you need and it goes out to nearby pros. The first offers usually land within about ten minutes." },
  { icon: icon(SEARCH), title: "Or browse providers", body: "Prefer to pick someone yourself? Browse verified providers by trade, rating and rate, then book directly." },
  { icon: icon(CALENDAR), title: "Track it in Bookings", body: "Once you hire, Bookings shows live progress — confirmed, on the way, arrived, working, done." },
  { icon: icon(CHAT), title: "Keep chat here", body: "Message your provider from the job page. Staying on PocketJobs leaves a record if anything goes wrong." },
  { icon: icon(WALLET), title: "Your wallet", body: "Jobs are paid in cash directly to your provider. The wallet is only for optional extras, and stays reachable in both modes." },
  { icon: icon(SWAP), title: "Want to earn too?", body: "Open Account to switch to provider mode. You can switch back whenever you like — nothing is lost." },
];

const PROVIDER_STEPS: Step[] = [
  { icon: icon(BRIEFCASE), title: "Find work", body: "Find work lists every open job near you, not just your trade — filter it down to your trade whenever you want." },
  { icon: icon(SEND), title: "Make an offer", body: "Open a job, set your price and start time, and send your offer. The client compares offers and hires." },
  { icon: icon(CALENDAR), title: "Run the job", body: "Work you win appears in Schedule. You drive the status as you go and the client follows along live." },
  { icon: icon(WALLET), title: "Your wallet", body: "You need a small balance to take work — commission comes out of it. Clients pay you in cash, and only you confirm payment." },
  { icon: icon(CHAT), title: "Messages", body: "Talk to clients here. Keeping it in the app protects you if a job is ever disputed." },
  { icon: icon(PERSON), title: "Your profile", body: "Add a photo, your services and a portfolio, and get verified — a complete profile wins noticeably more work." },
];

export default function OnboardingTour({ role }: { role: string }) {
  const isProvider = role === "provider";
  const steps = isProvider ? PROVIDER_STEPS : CUSTOMER_STEPS;
  const key = `pj_tour_seen_${isProvider ? "provider" : "customer"}`;
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    // Only these two roles get a tour; corporate and admin have their own bespoke screens.
    if (role !== "provider" && role !== "customer") return;
    try {
      if (!window.localStorage.getItem(key)) setOpen(true);
    } catch {
      /* private browsing — just skip the tour rather than breaking the app */
    }
  }, [key, role]);

  const finish = () => {
    setOpen(false);
    try { window.localStorage.setItem(key, "1"); } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") finish(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;
  const step = steps[i];
  const last = i === steps.length - 1;

  return (
    <div
      className="fixed inset-0 z-[100] bg-pj-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Getting started"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl">
        <button
          onClick={finish}
          aria-label="Skip the walkthrough"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-pj-slate-100 text-pj-slate-500 hover:bg-pj-slate-200"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-pj-blue-50 text-pj-blue-600">
          {step.icon}
        </div>
        <h2 className="text-xl font-bold tracking-tight text-pj-slate-900">{step.title}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-pj-slate-500">{step.body}</p>

        <div className="my-6 flex justify-center gap-1.5" aria-hidden="true">
          {steps.map((_, n) => (
            <span
              key={n}
              className={`h-1.5 rounded-full transition-all ${n === i ? "w-5 bg-pj-blue-600" : "w-1.5 bg-pj-slate-300"}`}
            />
          ))}
        </div>

        <button
          onClick={() => (last ? finish() : setI(i + 1))}
          className="w-full rounded-full bg-pj-blue-600 py-3.5 text-[15px] font-semibold text-white hover:bg-pj-blue-700"
        >
          {last ? "Got it — let's go" : "Next"}
        </button>
        {!last && (
          <button onClick={finish} className="mt-2 w-full py-2 text-sm font-medium text-pj-slate-500 hover:text-pj-slate-700">
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
