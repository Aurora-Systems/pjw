"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Embedded 30-second explainer films (self-playing HTML in /public/videos).
 * One film per point of view, toggled client/provider. The iframe only gets
 * its src once the section scrolls into view, so playback starts when the
 * visitor can actually see it; switching tabs reloads the film from 0:00.
 */
const FILMS = {
  client: {
    src: "/videos/how-it-works-client.html",
    title: "How Pocket Jobs works for clients — 30 second walkthrough",
  },
  provider: {
    src: "/videos/how-it-works-provider.html",
    title: "How Pocket Jobs works for providers — 30 second walkthrough",
  },
} as const;

type Pov = keyof typeof FILMS;

export default function HowItWorksFilms() {
  const [pov, setPov] = useState<Pov>("client");
  const [inView, setInView] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="animate-on-scroll mb-16">
      {/* POV toggle */}
      <div
        className="flex items-center justify-center gap-2 mb-6"
        role="tablist"
        aria-label="Choose a point of view"
      >
        {(
          [
            ["client", "I need something done"],
            ["provider", "I do the work"],
          ] as [Pov, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={pov === key}
            onClick={() => setPov(key)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer ${
              pov === key
                ? "bg-pj-blue-600 text-white shadow-md shadow-pj-blue-600/30"
                : "bg-white text-pj-slate-600 border border-pj-slate-200 hover:border-pj-blue-300 hover:text-pj-blue-600"
            }`}
            id={`hiw-film-tab-${key}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Film frame — 1200×680 canvas, self-scaling inside the iframe */}
      <div
        ref={frameRef}
        className="relative max-w-5xl mx-auto aspect-[1200/680] rounded-3xl overflow-hidden shadow-2xl shadow-pj-blue-900/20 bg-[#0a1120] ring-1 ring-pj-slate-900/10"
      >
        {inView ? (
          <iframe
            key={pov}
            src={FILMS[pov].src}
            title={FILMS[pov].title}
            className="absolute inset-0 w-full h-full border-0"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          /* Placeholder until the section scrolls into view */
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white/70 translate-x-[1px]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </div>
        )}
      </div>

      <p className="text-center text-sm text-pj-slate-400 mt-4">
        30 seconds · tap the film to pause, use the top segments to skip around
      </p>
    </div>
  );
}
