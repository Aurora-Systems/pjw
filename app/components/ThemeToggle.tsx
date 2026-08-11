"use client";

import { useTheme, type ThemeChoice } from "../lib/theme";

/**
 * Light / Dark / System control for the app header.
 *
 * A three-way segmented control rather than a two-state switch, because "follow my system"
 * is a genuinely different choice from "always light" — a plain toggle would silently drop it.
 */

const SUN = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <circle cx="12" cy="12" r="4" />
    <path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

const MOON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
  </svg>
);

const AUTO = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <rect x="3" y="4" width="18" height="13" rx="2" />
    <path strokeLinecap="round" d="M8 21h8M12 17v4" />
  </svg>
);

const OPTIONS: { value: ThemeChoice; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Light", icon: SUN },
  { value: "dark", label: "Dark", icon: MOON },
  { value: "system", label: "System", icon: AUTO },
];

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { choice, setChoice } = useTheme();

  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-full border border-pj-slate-200 bg-pj-slate-50 p-0.5 ${className}`}
      role="radiogroup"
      aria-label="Colour theme"
    >
      {OPTIONS.map((o) => {
        const active = choice === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.label}
            title={o.label}
            onClick={() => setChoice(o.value)}
            className={`grid h-7 w-7 place-items-center rounded-full transition-colors cursor-pointer ${
              active
                ? "bg-pj-blue-600 text-white"
                : "text-pj-slate-500 hover:text-pj-blue-600 hover:bg-pj-blue-50"
            }`}
          >
            {o.icon}
          </button>
        );
      })}
    </div>
  );
}
