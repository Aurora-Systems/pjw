"use client";

import React, { useState } from "react";
import type { SeriesPoint } from "../lib/types";

/**
 * Lightweight, dependency-free chart primitives for the admin dashboard.
 *
 * Design rules (kept deliberately narrow):
 *  - Single series → one brand hue (pj-blue-600, 5.17:1 on white) and NO legend;
 *    the card title says what is plotted.
 *  - Marks carry the colour; all text uses ink tokens (never the data colour).
 *  - Axis labels are HTML, not SVG <text>: the viewBox scales to the container
 *    (~490px desktop, ~318px mobile), which would shrink in-SVG type to ~6px.
 *  - Text colours are checked against white: pj-slate-500 = 7.58:1 (pass);
 *    pj-slate-400 = 2.56:1 (fails — never use it for labels).
 */

const BLUE = "#2563EB"; // pj-blue-600

const fmtDay = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
};

/** Compact number: 1,284 · 12.9K · 4.2M */
export function compact(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString("en-US");
}

/* ─────────────── Trend (single-series area + line) ─────────────── */

const W = 600;
const H = 180;
const PAD = { l: 4, r: 4, t: 18, b: 6 };

export function TrendChart({ data, noun }: { data: SeriesPoint[]; noun: string }) {
  const [hover, setHover] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="h-[180px] flex items-center justify-center text-sm text-pj-slate-500">No data yet</div>;
  }

  const n = data.length;
  const peak = Math.max(...data.map((d) => d.count));
  const max = Math.max(1, peak); // never divide by zero — a flat/empty series sits on the baseline
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const baseline = PAD.t + plotH;

  const x = (i: number) => PAD.l + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v: number) => PAD.t + plotH - (v / max) * plotH;

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(d.count).toFixed(2)}`).join(" ");
  const area = `${line} L${x(n - 1).toFixed(2)},${baseline} L${x(0).toFixed(2)},${baseline} Z`;

  const active = hover ?? n - 1; // default to the endpoint, so the latest value is always labelled
  const point = data[active];

  // Pin the tooltip's nearest EDGE inside the card at the extremes — a percentage-only
  // clamp ignores the callout's own width and overhangs on narrow screens.
  const pct = (x(active) / W) * 100;
  const tipAlign = pct < 15 ? "translate-x-0" : pct > 85 ? "-translate-x-full" : "-translate-x-1/2";

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const frac = (e.clientX - rect.left) / rect.width;
    const i = Math.round(frac * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  };

  return (
    <div className="relative">
      {/* y-max tick — HTML so it stays 12px regardless of the viewBox scale */}
      <div className="absolute left-0 top-0 text-xs text-pj-slate-500 tabular-nums">{max}</div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-[180px]"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label={`${noun} per day over the last ${n} days. Peak ${peak}, latest ${data[n - 1].count}.`}
      >
        {/* recessive gridlines */}
        {[0, 0.5, 1].map((t) => (
          <line
            key={t}
            x1={PAD.l}
            x2={W - PAD.r}
            y1={PAD.t + plotH * t}
            y2={PAD.t + plotH * t}
            stroke="#E2E8F0"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <path d={area} fill={BLUE} fillOpacity={0.1} />
        <path
          d={line}
          fill="none"
          stroke={BLUE}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* crosshair + marker on the active point (surface ring keeps it legible) */}
        <line
          x1={x(active)}
          x2={x(active)}
          y1={PAD.t}
          y2={baseline}
          stroke="#CBD5E1"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={x(active)} cy={y(point.count)} r={5} fill={BLUE} stroke="#FFFFFF" strokeWidth={2} />
      </svg>

      {/* x scale — HTML, same reason as the y tick */}
      <div className="mt-1 flex justify-between text-xs text-pj-slate-500">
        <span>{fmtDay(data[0].date)}</span>
        <span>{fmtDay(data[n - 1].date)}</span>
      </div>

      {/* tooltip */}
      <div
        className={`pointer-events-none absolute -top-2 ${tipAlign} rounded-lg bg-pj-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-lg whitespace-nowrap`}
        style={{ left: `${pct}%` }}
      >
        {point.count} {noun}
        <span className="font-normal text-pj-slate-300"> · {fmtDay(point.date)}</span>
      </div>
    </div>
  );
}

/* ─────────────── Breakdown bars (nominal → one hue, value at the tip) ─────────────── */

export function BarBreakdown({ items }: { items: { label: string; value: number }[] }) {
  if (!items.length) return <div className="py-8 text-center text-sm text-pj-slate-500">No data yet</div>;
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <div className="space-y-3">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-3">
          <div className="w-32 shrink-0 truncate text-sm text-pj-slate-600 capitalize" title={it.label}>
            {it.label}
          </div>
          {/* bar: 20px thick, square at the baseline, 4px rounded data-end */}
          <div className="relative h-5 flex-1 rounded-[4px] bg-pj-slate-50">
            <div
              className="h-full rounded-r-[4px] bg-pj-blue-600 transition-[width] duration-500"
              style={{ width: `${Math.max(it.value === 0 ? 0 : 2, (it.value / max) * 100)}%` }}
            />
          </div>
          <div className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums text-pj-slate-900">
            {it.value}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────── Stat tile (label · value · optional sub) ─────────────── */

export function StatTile({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: "default" | "good" | "warn";
}) {
  // 700 steps, not 600: the sub is 12px normal text, so it needs 4.5:1 on white
  // (emerald-600 = 3.65:1 and amber-600 = 3.2:1 both fail).
  const subTone =
    tone === "good" ? "text-emerald-700" : tone === "warn" ? "text-amber-700" : "text-pj-slate-500";
  return (
    <div className="rounded-2xl border border-pj-slate-200 bg-white p-5">
      <div className="text-xs font-medium text-pj-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-extrabold text-pj-slate-900">{value}</div>
      {sub && <div className={`mt-1 text-xs font-medium ${subTone}`}>{sub}</div>}
    </div>
  );
}
