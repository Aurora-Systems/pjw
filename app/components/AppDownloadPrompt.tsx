"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getToken } from "../lib/api";
import { APP_STORE_URL, PLAY_STORE_URL, detectClientPlatform, type Platform } from "../lib/appStores";
import StoreBadges, { AppStoreBadge, PlayStoreBadge } from "./StoreBadges";

/**
 * A one-off "Get the app" prompt, mounted once in the root layout.
 *
 * It is built to be easy to ignore:
 *  - waits SHOW_AFTER_MS before appearing, so it never covers a visitor's first look;
 *  - stays away for SNOOZE_DAYS after "Not now", and for good once a store was opened;
 *  - never appears mid-task: sign-in, sign-up, onboarding, payment, the admin console, or
 *    while another dialog (the first-run tour) or the mobile menu is open;
 *  - never shows to admins, who run the platform from the web on purpose.
 *
 * Phones get a bottom sheet with their own store; desktops get both stores and a QR code,
 * since a desktop can't install the app itself.
 */

const STORAGE_KEY = "pj_app_prompt";
const SHOW_AFTER_MS = 8000;
const RETRY_MS = 3000;
const SNOOZE_DAYS = 14;

const HIDDEN_ON = ["/login", "/signup", "/verify", "/auth", "/onboarding", "/payment", "/admin", "/download", "/unsubscribe"];

type Saved = { dismissedAt?: number; opened?: boolean };

function readSaved(): Saved {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}") as Saved;
  } catch {
    return {};
  }
}

function save(next: Saved) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* private browsing: the prompt may come back next visit, which is harmless */
  }
}

/** Whether the visitor has already said no recently, or already went to a store. */
function isSnoozed(): boolean {
  const s = readSaved();
  if (s.opened) return true;
  return !!s.dismissedAt && Date.now() - s.dismissedAt < SNOOZE_DAYS * 86_400_000;
}

/** Role from the signed-in token, read only to keep this away from admins. Not a security check. */
function signedInRole(): string | null {
  try {
    const token = getToken();
    if (!token) return null;
    const part = token.split(".")[1];
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    return (JSON.parse(json) as { role?: string }).role ?? null;
  } catch {
    return null;
  }
}

/** Another dialog is up, or the mobile menu is open (it locks body scroll). */
function somethingElseIsOpen(): boolean {
  if (document.querySelector('[aria-modal="true"]')) return true;
  if (document.body.style.overflow === "hidden") return true;
  return false;
}

export default function AppDownloadPrompt() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusTo = useRef<Element | null>(null);

  const eligiblePath = !HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  useEffect(() => {
    if (open || !eligiblePath) return;
    if (isSnoozed() || signedInRole() === "admin") return;
    // Inside the Capacitor app this page would be pointless.
    if ((window as unknown as { Capacitor?: unknown }).Capacitor) return;

    let timer: number;
    const tryOpen = () => {
      if (isSnoozed()) return;
      if (somethingElseIsOpen()) {
        timer = window.setTimeout(tryOpen, RETRY_MS);
        return;
      }
      returnFocusTo.current = document.activeElement;
      setPlatform(detectClientPlatform());
      setOpen(true);
    };
    timer = window.setTimeout(tryOpen, SHOW_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [open, eligiblePath]);

  const close = useCallback((opened: boolean) => {
    save(opened ? { opened: true } : { dismissedAt: Date.now() });
    setOpen(false);
    (returnFocusTo.current as HTMLElement | null)?.focus?.();
  }, []);

  // Esc closes it, and focus starts on the dialog so keyboard users land inside it.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;

  const onPhone = platform !== "other";
  const opened = () => close(true);

  return (
    <div
      className={`fixed inset-0 z-[90] flex justify-center bg-pj-slate-900/50 backdrop-blur-[2px] animate-fade-in ${
        onPhone ? "items-end p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]" : "items-center p-4"
      }`}
      onClick={() => close(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-prompt-title"
        className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl p-6 sm:p-7 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={() => close(false)}
          aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-pj-slate-400 hover:text-pj-slate-700 hover:bg-pj-slate-100 transition cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-4 pr-10">
          <Image
            src="/pocket_jobs_logo.png"
            alt=""
            width={56}
            height={56}
            className="w-14 h-14 rounded-2xl shadow-sm ring-1 ring-pj-slate-100 bg-white shrink-0"
          />
          <div>
            <h2 id="app-prompt-title" className="text-lg sm:text-xl font-bold text-pj-slate-900 leading-tight">
              Get the PocketJobs app
            </h2>
            <p className="text-sm text-pj-slate-500 mt-0.5">Free on iPhone and Android</p>
          </div>
        </div>

        <p className="text-[15px] text-pj-slate-600 leading-relaxed mt-5">
          Get instant alerts for new jobs and offers, chat with photos, and track your provider on
          the way, all from your phone.
        </p>

        {onPhone ? (
          <div className="mt-6 flex flex-col items-center gap-3">
            {platform === "ios" ? <AppStoreBadge size="lg" onClick={opened} /> : <PlayStoreBadge size="lg" onClick={opened} />}
            {/* Someone on an iPhone may want to share the Android link, and vice versa. */}
            <a
              href={platform === "ios" ? PLAY_STORE_URL : APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={opened}
              className="text-sm text-pj-slate-500 hover:text-pj-blue-600 underline-offset-2 hover:underline"
            >
              {platform === "ios" ? "Also on Google Play" : "Also on the App Store"}
            </a>
          </div>
        ) : (
          <div className="mt-6 flex items-center gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/download-qr.svg"
              alt="QR code linking to the PocketJobs app"
              width={112}
              height={112}
              className="w-28 h-28 rounded-xl border border-pj-slate-200 bg-white p-1.5 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-pj-slate-900">Scan with your phone camera</p>
              <p className="text-sm text-pj-slate-500 mt-0.5 mb-3">or pick your store:</p>
              <StoreBadges onClick={opened} className="!gap-2" />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => close(false)}
          className="mt-5 w-full py-2.5 text-sm font-semibold text-pj-slate-500 hover:text-pj-slate-800 transition cursor-pointer"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
