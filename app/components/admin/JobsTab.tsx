"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import type { AdminJob } from "../../lib/types";
import { Empty, Loading } from "../ui";
import Button from "../Button";
import {
  ConfirmDialog,
  ErrorNote,
  FilterPills,
  JobStatusBadge,
  Pager,
  SearchInput,
  TableShell,
  Td,
  Th,
  errText,
  money,
  timeAgo,
  useDebounced,
} from "./shared";

const LIMIT = 25;

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "open", label: "Open" },
  { value: "assigned", label: "Assigned" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const budget = (j: AdminJob) => {
  if (j.budget_min === null && j.budget_max === null) return "—";
  if (j.budget_min !== null && j.budget_max !== null && j.budget_min !== j.budget_max)
    return `${money(j.budget_min)} – ${money(j.budget_max)}`;
  return money(j.budget_max ?? j.budget_min);
};

export default function JobsTab() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [offset, setOffset] = useState(0);

  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<AdminJob | null>(null);

  const debouncedQ = useDebounced(q);
  const seq = useRef(0);

  const load = useCallback(async () => {
    const mine = ++seq.current;
    setLoading(true);
    try {
      const res = await api.adminJobs({ q: debouncedQ || undefined, status: status || undefined, limit: LIMIT, offset });
      if (mine !== seq.current) return;
      setJobs(res.jobs);
      setTotal(res.total);
      setErr(null);
    } catch (e) {
      if (mine !== seq.current) return;
      setErr(errText(e, "Could not load jobs."));
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, [debouncedQ, status, offset]);

  useEffect(() => {
    void load();
  }, [load]);

  // Reset paging where the filter changes, not in an effect watching it.
  const changeQ = (next: string) => {
    setQ(next);
    setOffset(0);
  };
  const changeStatus = (next: string) => {
    setStatus(next);
    setOffset(0);
  };

  const cancel = async (job: AdminJob, reason: string) => {
    await api.adminCancelJob(job.id, reason);
    setJobs((list) => list.map((j) => (j.id === job.id ? { ...j, status: "cancelled" } : j)));
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchInput value={q} onChange={changeQ} placeholder="Search title, category, place or customer…" />
        <FilterPills options={STATUS_OPTIONS} value={status} onChange={changeStatus} />
      </div>

      {err && (
        <div className="mb-4">
          <ErrorNote onRetry={() => void load()}>{err}</ErrorNote>
        </div>
      )}

      {loading && jobs.length === 0 ? (
        <Loading />
      ) : jobs.length === 0 ? (
        <Empty>No jobs match that.</Empty>
      ) : (
        <>
          <TableShell minWidth={980}>
            <thead className="bg-pj-slate-50 border-b border-pj-slate-200">
              <tr>
                <Th>Job</Th>
                <Th>Customer</Th>
                <Th>Budget</Th>
                <Th>Offers</Th>
                <Th>Hired</Th>
                <Th>Age</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pj-slate-200">
              {jobs.map((j) => {
                const staffed = j.hired_count >= j.workers_needed;
                return (
                  <tr key={j.id}>
                    <Td>
                      <div className="font-semibold text-pj-slate-900 truncate max-w-[260px]">{j.title}</div>
                      <div className="text-xs text-pj-slate-500 truncate max-w-[260px]">
                        {j.category ?? "uncategorised"}
                        {j.location ? ` · ${j.location}` : ""}
                      </div>
                    </Td>
                    <Td className="text-pj-slate-700 whitespace-nowrap truncate max-w-[160px]">{j.customer_name}</Td>
                    <Td className="whitespace-nowrap">{budget(j)}</Td>
                    <Td>
                      <span className={j.offers === 0 ? "text-pj-slate-400" : "text-pj-slate-900 font-semibold"}>
                        {j.offers}
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap">
                      {/* A multi-hire job stays 'open' while partly staffed, so this is the real state. */}
                      <span className={j.hired_count > 0 && !staffed ? "text-amber-700 font-semibold" : ""}>
                        {j.hired_count} of {j.workers_needed}
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap text-pj-slate-500">{timeAgo(j.created_at)}</Td>
                    <Td>
                      <JobStatusBadge status={j.status} />
                    </Td>
                    <Td className="text-right whitespace-nowrap">
                      {j.status === "open" ? (
                        <Button size="sm" variant="ghost" onClick={() => setCancelling(j)}>
                          Cancel
                        </Button>
                      ) : (
                        <span className="text-xs text-pj-slate-400">—</span>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
          <Pager offset={offset} limit={LIMIT} total={total} onChange={setOffset} />
        </>
      )}

      {cancelling && (
        <ConfirmDialog
          title="Cancel this job?"
          confirmLabel="Cancel the job"
          danger
          reasonRequired
          reasonHint="The customer is told this reason, and it goes on the audit trail."
          onClose={() => setCancelling(null)}
          onConfirm={(reason) => cancel(cancelling, reason)}
        >
          <p className="text-pj-slate-700 font-semibold">{cancelling.title}</p>
          <p>
            Posted by {cancelling.customer_name} {timeAgo(cancelling.created_at)} · {cancelling.offers} offer
            {cancelling.offers === 1 ? "" : "s"}.
          </p>
          {cancelling.hired_count > 0 ? (
            <p className="text-red-600">
              {cancelling.hired_count} provider{cancelling.hired_count === 1 ? " is" : "s are"} already hired on this
              job, so it cannot be cancelled — each of them holds a booking and has paid commission. Cancel their
              individual bookings instead; that path refunds the commission.
            </p>
          ) : (
            <p>The customer is notified, and any pending offers go nowhere. Nothing here refunds money.</p>
          )}
        </ConfirmDialog>
      )}
    </>
  );
}
