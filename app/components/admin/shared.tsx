"use client";

import React, { useEffect, useState } from "react";
import Button from "../Button";
import { Badge, inputClass } from "../ui";

/* ───────────────────────────────────────────
   Small pieces every admin tab shares: formatting, a modal, the confirm-with-a-reason
   dialog that guards destructive work, filter pills, a table shell and a pager.
   Everything here is themed with pj-* tokens / bg-white so it flips in dark mode.
   ─────────────────────────────────────────── */

export const money = (n: number | null | undefined) => {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const s = Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${n < 0 ? "−" : ""}$${s}`;
};

/** Signed, for ledger rows where the direction of the movement is the point. */
export const signedMoney = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}$${Math.abs(n).toFixed(2)}`;

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "just now";
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)}m ago`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)}h ago`;
  const d = h / 24;
  if (d < 30) return `${Math.floor(d)}d ago`;
  const mo = d / 30;
  if (mo < 12) return `${Math.floor(mo)}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/** Message out of anything thrown by the api layer (ApiError carries the server's text). */
export const errText = (e: unknown, fallback = "That didn't work. Try again.") =>
  e instanceof Error && e.message ? e.message : fallback;

/** Debounce a value so typing in a search box doesn't fire a request per keystroke. */
export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`bg-white rounded-2xl p-6 w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-pj-slate-900">{title}</h3>
        {children}
      </div>
    </div>
  );
}

/**
 * The guard in front of every destructive or money-touching action: it states the effect,
 * takes a typed reason and only then runs. `onConfirm` rejecting keeps the dialog open with
 * the server's own message, which is how the hired_count guard and the wallet errors surface.
 */
export function ConfirmDialog({
  title,
  confirmLabel = "Confirm",
  danger = false,
  /** Hide the field entirely where the endpoint takes no reason — never ask for one we drop. */
  showReason = true,
  reasonRequired = false,
  reasonLabel = "Reason",
  reasonHint = "Recorded on the audit trail against your name.",
  reasonMaxLength = 500,
  reasonRows = 2,
  reasonPlaceholder,
  children,
  onConfirm,
  onClose,
}: {
  title: string;
  confirmLabel?: string;
  danger?: boolean;
  showReason?: boolean;
  reasonRequired?: boolean;
  reasonLabel?: string;
  reasonHint?: string;
  /** Where the "reason" is really a message to a user, give it letter-sized room. */
  reasonMaxLength?: number;
  reasonRows?: number;
  reasonPlaceholder?: string;
  children?: React.ReactNode;
  onConfirm: (reason: string) => Promise<void>;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    const r = showReason ? reason.trim() : "";
    if (showReason && reasonRequired && !r) {
      setErr("Type a reason first — it goes on the audit trail.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await onConfirm(r);
      onClose();
    } catch (e) {
      setErr(errText(e));
      setBusy(false);
    }
  };

  return (
    <Modal title={title} onClose={busy ? () => {} : onClose}>
      <div className="mt-2 text-sm text-pj-slate-500 space-y-2">{children}</div>

      {showReason && (
        <label className="block mt-4">
          <span className="block text-sm font-semibold text-pj-slate-700 mb-1">
            {reasonLabel}
            {reasonRequired ? " (required)" : " (optional)"}
          </span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={reasonRows}
            maxLength={reasonMaxLength}
            placeholder={
              reasonPlaceholder ??
              (reasonRequired ? "Why are you doing this?" : "Add context for whoever reads this later")
            }
            className={inputClass}
          />
          <span className="flex justify-between gap-3 text-xs text-pj-slate-400 mt-1">
            <span>{reasonHint}</span>
            {reasonMaxLength > 500 && (
              <span className="shrink-0 tabular-nums">
                {reason.length}/{reasonMaxLength}
              </span>
            )}
          </span>
        </label>
      )}

      {err && <p className="text-sm text-red-600 mt-3">{err}</p>}

      <div className="flex gap-2 mt-5">
        <Button
          className={`flex-1 ${danger ? "bg-red-600 hover:bg-red-700 active:bg-red-800" : ""}`}
          disabled={busy}
          onClick={run}
        >
          {busy ? "Working…" : confirmLabel}
        </Button>
        <Button variant="ghost" disabled={busy} onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}

/** Segmented filter — the same control for user status, job status and enquiry status. */
export function FilterPills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition cursor-pointer ${
              active
                ? "bg-pj-blue-600 text-white"
                : "bg-pj-slate-100 text-pj-slate-600 hover:bg-pj-slate-200"
            }`}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={`ml-1.5 text-xs ${active ? "text-white/80" : "text-pj-slate-400"}`}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative flex-1 min-w-[200px]">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputClass} py-2.5 pr-9`}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-pj-slate-400 hover:text-pj-slate-900 cursor-pointer"
        >
          ×
        </button>
      )}
    </div>
  );
}

export function TableShell({ children, minWidth = 760 }: { children: React.ReactNode; minWidth?: number }) {
  return (
    <div className="rounded-2xl border border-pj-slate-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth }}>
          {children}
        </table>
      </div>
    </div>
  );
}

export function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={`text-left font-semibold text-xs uppercase tracking-wide text-pj-slate-500 px-4 py-3 whitespace-nowrap ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle text-pj-slate-700 ${className}`}>{children}</td>;
}

export function Pager({
  offset,
  limit,
  total,
  onChange,
}: {
  offset: number;
  limit: number;
  total: number;
  onChange: (offset: number) => void;
}) {
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, total);
  return (
    <div className="flex items-center justify-between gap-3 mt-4">
      <p className="text-sm text-pj-slate-500">
        {from}–{to} of {total}
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={offset === 0} onClick={() => onChange(Math.max(0, offset - limit))}>
          Previous
        </Button>
        <Button size="sm" variant="outline" disabled={to >= total} onClick={() => onChange(offset + limit)}>
          Next
        </Button>
      </div>
    </div>
  );
}

/** A red strip for a failed load — better than an empty table that looks like "no data". */
export function ErrorNote({ children, onRetry }: { children: React.ReactNode; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center justify-between gap-4">
      <p className="text-sm text-red-600">{children}</p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

const JOB_STATUS_COLOR: Record<string, "blue" | "green" | "amber" | "slate" | "red"> = {
  open: "blue",
  assigned: "amber",
  completed: "green",
  cancelled: "slate",
};

export function JobStatusBadge({ status }: { status: string }) {
  return <Badge color={JOB_STATUS_COLOR[status] ?? "slate"}>{status}</Badge>;
}

const ROLE_COLOR: Record<string, "blue" | "green" | "amber" | "slate" | "red"> = {
  admin: "red",
  provider: "blue",
  customer: "slate",
  corporate: "amber",
};

export function RoleBadge({ role }: { role: string }) {
  return <Badge color={ROLE_COLOR[role] ?? "slate"}>{role}</Badge>;
}
