import React from "react";

/** Round avatar — shows the image when present, otherwise the person's initials. */
export function Avatar({ src, name, size = 44 }: { src?: string | null; name?: string | null; size?: number }) {
  const initials = (name || "?").trim().slice(0, 2).toUpperCase();
  return (
    <div
      className="rounded-full bg-pj-blue-100 text-pj-blue-700 flex items-center justify-center font-bold shrink-0 bg-cover bg-center overflow-hidden"
      style={{ width: size, height: size, backgroundImage: src ? `url(${src})` : undefined, fontSize: size * 0.4 }}
    >
      {!src && initials}
    </div>
  );
}

/** Shield marker for ID-verified providers. */
export function VerifiedBadge({ size = 16, withLabel = false }: { size?: number; withLabel?: boolean }) {
  return (
    <span title="Verified provider" className="inline-flex items-center gap-1 text-pj-blue-600 align-middle">
      <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} aria-hidden="true">
        <path d="M11.48 2.17a.75.75 0 0 1 1.04 0 11.2 11.2 0 0 0 7.88 3.08.75.75 0 0 1 .72.52c.41 1.25.63 2.59.63 3.98 0 5.94-4.06 10.93-9.56 12.35a.75.75 0 0 1-.38 0C6.31 20.68 2.25 15.69 2.25 9.75c0-1.39.22-2.73.63-3.98a.75.75 0 0 1 .72-.52h.15c3 0 5.71-1.17 7.73-3.08Zm4.13 7.02a.75.75 0 0 0-1.22-.87l-3.24 4.53-1.5-1.5a.75.75 0 1 0-1.06 1.06l2.12 2.12a.75.75 0 0 0 1.14-.09l3.76-5.25Z" />
      </svg>
      {withLabel && <span className="text-xs font-semibold">Verified</span>}
    </span>
  );
}

export function Card({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-pj-slate-200 bg-white p-5 ${onClick ? "cursor-pointer hover:border-pj-blue-300 hover:shadow-sm transition" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({ children, color = "blue" }: { children: React.ReactNode; color?: "blue" | "green" | "amber" | "slate" | "red" }) {
  const map = {
    blue: "bg-pj-blue-50 text-pj-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-pj-slate-100 text-pj-slate-600",
    red: "bg-red-50 text-red-600",
  };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[color]}`}>{children}</span>;
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg className={`animate-spin h-5 w-5 text-pj-blue-600 ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-extrabold text-pj-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-pj-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <Card className="text-center">
      <div className="text-2xl font-extrabold text-pj-slate-900">{value}</div>
      <div className="text-xs text-pj-slate-500 mt-1">{label}</div>
    </Card>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-pj-slate-700 mb-2">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full px-4 py-3 rounded-xl border border-pj-slate-200 text-pj-slate-900 placeholder:text-pj-slate-400 focus:outline-none focus:ring-2 focus:ring-pj-blue-500 focus:border-pj-blue-500 transition";

export function Loading() {
  return (
    <div className="flex items-center justify-center py-24">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-center py-16 text-pj-slate-500">{children}</div>;
}
