"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { AdminAction } from "../../lib/types";
import { Badge, Empty, Loading } from "../ui";
import Button from "../Button";
import { ErrorNote, SearchInput, TableShell, Td, Th, errText, fmtDateTime, timeAgo } from "./shared";

/** Green for granting, red for taking away, amber for money — readable at a glance. */
function actionColor(action: string): "blue" | "green" | "amber" | "slate" | "red" {
  if (action.startsWith("wallet.")) return "amber";
  if (/(ban|unverify|cancel|reject|delete|revoke)/.test(action)) return "red";
  if (/(verify|unban|approve|resolve)/.test(action)) return "green";
  if (action.startsWith("enquiry.")) return "blue";
  return "slate";
}

/** The detail blob is free-form jsonb; show it as flat pairs rather than raw JSON. */
function detailPairs(detail: Record<string, unknown> | null): string {
  if (!detail || typeof detail !== "object") return "";
  return Object.entries(detail)
    .map(([k, v]) => `${k}: ${v === null ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v)}`)
    .join(" · ");
}

export default function AuditTab() {
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.adminAudit(200);
      setActions(res.actions);
      setErr(null);
    } catch (e) {
      setErr(errText(e, "Could not load the audit trail."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Filtered in the browser: the route returns a bounded, already-small list.
  const needle = q.trim().toLowerCase();
  const shown = needle
    ? actions.filter((a) =>
        [a.admin_name, a.action, a.target_type, a.target_id, a.reason, detailPairs(a.detail)]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle)
      )
    : actions;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchInput value={q} onChange={setQ} placeholder="Filter by admin, action, target or reason…" />
        <Button size="sm" variant="outline" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      {err && (
        <div className="mb-4">
          <ErrorNote onRetry={() => void load()}>{err}</ErrorNote>
        </div>
      )}

      {loading && actions.length === 0 ? (
        <Loading />
      ) : shown.length === 0 ? (
        <Empty>{actions.length === 0 ? "Nothing has been done yet." : "No action matches that."}</Empty>
      ) : (
        <>
          <TableShell minWidth={900}>
            <thead className="bg-pj-slate-50 border-b border-pj-slate-200">
              <tr>
                <Th>When</Th>
                <Th>Admin</Th>
                <Th>Action</Th>
                <Th>Target</Th>
                <Th>Reason</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pj-slate-200">
              {shown.map((a) => (
                <tr key={a.id}>
                  <Td className="whitespace-nowrap text-pj-slate-500">
                    <div>{timeAgo(a.created_at)}</div>
                    <div className="text-xs text-pj-slate-400">{fmtDateTime(a.created_at)}</div>
                  </Td>
                  <Td className="whitespace-nowrap font-semibold text-pj-slate-900">
                    {/* admin_id is ON DELETE SET NULL — the row outlives its author on purpose. */}
                    {a.admin_name || <span className="text-pj-slate-400 font-normal">removed admin</span>}
                  </Td>
                  <Td>
                    <Badge color={actionColor(a.action)}>{a.action}</Badge>
                  </Td>
                  <Td>
                    <div className="text-pj-slate-700">{a.target_type ?? "—"}</div>
                    {a.target_id && (
                      <div className="text-xs text-pj-slate-400 font-mono truncate max-w-[200px]" title={a.target_id}>
                        {a.target_id}
                      </div>
                    )}
                    {a.detail && (
                      <div className="text-xs text-pj-slate-500 mt-1 max-w-[280px] break-words">
                        {detailPairs(a.detail)}
                      </div>
                    )}
                  </Td>
                  <Td className="text-pj-slate-700 max-w-[240px] break-words">
                    {a.reason || <span className="text-pj-slate-400">no reason given</span>}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          <p className="text-sm text-pj-slate-500 mt-4">
            {shown.length} of the {actions.length} most recent actions.
          </p>
        </>
      )}
    </>
  );
}
