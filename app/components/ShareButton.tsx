"use client";

import { useEffect, useRef, useState } from "react";

/**
 * "Share" for a job (or any page). On phones and in browsers with a share sheet it opens
 * the device's own sheet, which already lists WhatsApp, SMS and so on. Everywhere else it
 * drops a small menu: WhatsApp (how most people here pass a job along), Facebook, and
 * Copy link.
 */

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0-12 4 4m-4-4L8 7M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
    </svg>
  );
}

export default function ShareButton({
  path,
  title,
  text,
  label = "Share",
  size = "md",
  className = "",
}: {
  /** Site-relative path to share, e.g. jobSharePath(id). The current origin is added. */
  path: string;
  title: string;
  text: string;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  // Close the menu on an outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const url = () => `${window.location.origin}${path}`;

  const onClick = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url: url() });
        return;
      } catch (e) {
        // Dismissing the sheet is not an error worth a fallback menu.
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    setOpen((o) => !o);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url());
    } catch {
      // Older browsers: select-and-copy through a temporary field.
      const t = document.createElement("textarea");
      t.value = url();
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 1400);
  };

  const pad = size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-sm";
  const item =
    "flex w-full items-center gap-3 px-4 py-2.5 text-sm text-pj-slate-700 hover:bg-pj-slate-50 transition text-left cursor-pointer";

  return (
    <div ref={wrap} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={onClick}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded-full border border-pj-slate-200 bg-white font-semibold text-pj-slate-700 hover:border-pj-blue-300 hover:text-pj-blue-600 transition cursor-pointer ${pad}`}
      >
        <ShareIcon className="w-4 h-4" />
        {label}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-2xl border border-pj-slate-100 bg-white py-1.5 shadow-xl"
        >
          <a
            role="menuitem"
            href={`https://wa.me/?text=${encodeURIComponent(`${text} ${typeof window !== "undefined" ? url() : ""}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className={item}
          >
            <svg className="w-5 h-5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.56.94.95-3.47-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.24-9.43 9.44-9.43 2.52 0 4.89.98 6.67 2.77a9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.24 9.43-9.44 9.43m8.03-17.46A11.27 11.27 0 0 0 12.05.72C5.8.72.72 5.8.72 12.05c0 2 .52 3.95 1.52 5.66L.63 23.28l5.7-1.5a11.3 11.3 0 0 0 5.71 1.46h.01c6.25 0 11.33-5.08 11.33-11.33 0-3.03-1.18-5.87-3.32-8.01" />
            </svg>
            WhatsApp
          </a>
          <a
            role="menuitem"
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== "undefined" ? url() : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className={item}
          >
            <svg className="w-5 h-5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M24 12.07C24 5.44 18.63.07 12 .07S0 5.44 0 12.07c0 5.99 4.39 10.95 10.13 11.85v-8.38H7.08v-3.47h3.05V9.43c0-3.01 1.79-4.67 4.53-4.67 1.31 0 2.69.23 2.69.23v2.95h-1.51c-1.49 0-1.96.93-1.96 1.87v2.26h3.33l-.53 3.47h-2.8v8.38C19.61 23.02 24 18.06 24 12.07" />
            </svg>
            Facebook
          </a>
          <button type="button" role="menuitem" onClick={copy} className={item}>
            <svg className="w-5 h-5 text-pj-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.69a4.5 4.5 0 0 1 1.24 7.24l-4.5 4.5a4.5 4.5 0 0 1-6.36-6.36l1.76-1.76m13.06-.62 1.76-1.76a4.5 4.5 0 0 0-6.36-6.36l-4.5 4.5a4.5 4.5 0 0 0 1.24 7.24" />
            </svg>
            {copied ? "Link copied" : "Copy link"}
          </button>
        </div>
      )}
    </div>
  );
}
