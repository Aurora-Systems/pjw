"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Light / dark theming for the signed-in app.
 *
 * "system" follows the OS and keeps following it as the OS flips; "light" and "dark" pin it.
 * The choice is per-device (localStorage), not per-account — someone using a dark laptop and a
 * light phone wants different answers on each.
 *
 * The resolved theme is written to `data-pj-theme` on <html>, which is what globals.css keys the
 * dark palette off. ThemeProvider only mounts inside the (app) route group and clears the
 * attribute on unmount, so the public marketing pages keep their intentional light identity.
 */

export type ThemeChoice = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "pj_theme";
const ATTR = "data-pj-theme";

interface ThemeContextValue {
  /** What the user picked — may be "system". */
  choice: ThemeChoice;
  /** What that actually resolves to right now. */
  resolved: ResolvedTheme;
  setChoice: (choice: ThemeChoice) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  choice: "system",
  resolved: "light",
  setChoice: () => {},
});

export const useTheme = () => useContext(ThemeContext);

function readStoredChoice(): ThemeChoice {
  if (typeof window === "undefined") return "system";
  try {
    const v = window.localStorage.getItem(THEME_STORAGE_KEY);
    return v === "light" || v === "dark" || v === "system" ? v : "system";
  } catch {
    return "system"; // private browsing / storage disabled
  }
}

const prefersDark = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Lazy initialisers so the very first client render already has the right value and we don't
  // paint light-then-dark. The server always renders "system"/"light"; the inline script in the
  // root layout is what prevents a flash before hydration.
  const [choice, setChoiceState] = useState<ThemeChoice>(readStoredChoice);
  const [systemDark, setSystemDark] = useState<boolean>(prefersDark);

  // Track the OS setting continuously — "system" has to keep up with it, not just sample it once.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const resolved: ResolvedTheme = choice === "system" ? (systemDark ? "dark" : "light") : choice;

  // Stamp the attribute while an app route is mounted; strip it on the way out so navigating to
  // a marketing page can never leave it behind.
  useEffect(() => {
    document.documentElement.setAttribute(ATTR, resolved);
    return () => document.documentElement.removeAttribute(ATTR);
  }, [resolved]);

  const setChoice = useCallback((next: ThemeChoice) => {
    setChoiceState(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* storage disabled — the choice still applies for this session */
    }
  }, []);

  const value = useMemo(() => ({ choice, resolved, setChoice }), [choice, resolved, setChoice]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Runs before first paint, ahead of React, so an app route never flashes light before the
 * stored preference is applied. Deliberately gated on the path: the marketing site is
 * light-only, and stamping the attribute there would darken it too.
 *
 * Kept dependency-free and defensive — it executes before anything else on the page, so a
 * throw here would break the whole document.
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var p=location.pathname,a=["/dashboard","/browse","/post-job","/jobs","/bookings","/messages","/my-bids","/work","/schedule","/earnings","/profile","/account","/providers","/hiring","/admin","/onboarding","/payment"],m=false;
for(var i=0;i<a.length;i++){if(p===a[i]||p.indexOf(a[i]+"/")===0){m=true;break}}
if(!m)return;
var c=null;try{c=localStorage.getItem("${THEME_STORAGE_KEY}")}catch(e){}
var d=(c==="dark")||((c==="system"||!c)&&window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches);
document.documentElement.setAttribute("${ATTR}",d?"dark":"light");
}catch(e){}})();`;
