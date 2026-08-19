"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import type { Enquiry, EnquiryCounts, EnquiryDetail, EnquiryReply, EnquiryStatus } from "../../lib/types";
import { Badge, Empty, Loading, Spinner, inputClass } from "../ui";
import Button from "../Button";
import {
  ErrorNote,
  FilterPills,
  Pager,
  SearchInput,
  TableShell,
  Td,
  errText,
  fmtDateTime,
  timeAgo,
  useDebounced,
} from "./shared";

const LIMIT = 25;

const STATUS_COLOR: Record<EnquiryStatus, "blue" | "green" | "slate"> = {
  open: "blue",
  answered: "green",
  closed: "slate",
};

export default function EnquiriesTab({ onCounts }: { onCounts?: (c: EnquiryCounts) => void }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<EnquiryStatus | "">("open");
  const [offset, setOffset] = useState(0);

  const [list, setList] = useState<Enquiry[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<EnquiryCounts>({ open: 0, answered: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const debouncedQ = useDebounced(q);
  const seq = useRef(0);
  // Held in a ref so an inline callback from the parent can't re-trigger the load effect.
  const onCountsRef = useRef(onCounts);
  useEffect(() => {
    onCountsRef.current = onCounts;
  });

  const load = useCallback(async () => {
    const mine = ++seq.current;
    setLoading(true);
    try {
      const res = await api.adminEnquiries({ status: status || undefined, q: debouncedQ || undefined, limit: LIMIT, offset });
      if (mine !== seq.current) return;
      setList(res.enquiries);
      setTotal(res.total);
      setCounts(res.counts);
      onCountsRef.current?.(res.counts);
      setErr(null);
      // The open thread stays open even when the refresh drops it from the list — replying
      // moves an enquiry out of the "Open" filter, and the "saved but not emailed" warning
      // must not vanish underneath the admin who just caused it.
      setSelectedId((cur) => cur ?? res.enquiries[0]?.id ?? null);
    } catch (e) {
      if (mine !== seq.current) return;
      setErr(errText(e, "Could not load enquiries."));
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, [status, debouncedQ, offset]);

  useEffect(() => {
    void load();
  }, [load]);

  // Paging resets where the filter changes rather than in an effect watching it — an
  // effect would render page 2 of the old result set first, then snap back.
  const changeStatus = (next: EnquiryStatus | "") => {
    setStatus(next);
    setOffset(0);
  };
  const changeQ = (next: string) => {
    setQ(next);
    setOffset(0);
  };

  const statusOptions = [
    { value: "open" as const, label: "Open", count: counts.open },
    { value: "answered" as const, label: "Answered", count: counts.answered },
    { value: "closed" as const, label: "Closed", count: counts.closed },
    { value: "" as const, label: "All", count: counts.open + counts.answered + counts.closed },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchInput value={q} onChange={changeQ} placeholder="Search name, email, phone or message…" />
        <FilterPills options={statusOptions} value={status} onChange={changeStatus} />
      </div>

      {err && (
        <div className="mb-4">
          <ErrorNote onRetry={() => void load()}>{err}</ErrorNote>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-2">
          {loading && list.length === 0 ? (
            <Loading />
          ) : list.length === 0 ? (
            <Empty>Nothing here. {status === "open" ? "The inbox is clear." : "Try another filter."}</Empty>
          ) : (
            <>
              <TableShell minWidth={320}>
                <tbody className="divide-y divide-pj-slate-200">
                  {list.map((e) => {
                    const active = e.id === selectedId;
                    return (
                      <tr
                        key={e.id}
                        onClick={() => setSelectedId(e.id)}
                        className={`cursor-pointer transition ${active ? "bg-pj-blue-50" : "hover:bg-pj-slate-50"}`}
                      >
                        <Td className="py-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-pj-slate-900 truncate">{e.name || "Someone"}</span>
                            <span className="text-xs text-pj-slate-400 shrink-0">{timeAgo(e.created_at)}</span>
                          </div>
                          <div className="text-sm text-pj-slate-700 truncate">{e.subject || "(no subject)"}</div>
                          <div className="text-xs text-pj-slate-500 truncate">{e.message}</div>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <Badge color={STATUS_COLOR[e.status]}>{e.status}</Badge>
                            <Badge color="slate">{e.source}</Badge>
                            {e.reply_count > 0 && (
                              <span className="text-xs text-pj-slate-400">
                                {e.reply_count} repl{e.reply_count === 1 ? "y" : "ies"}
                              </span>
                            )}
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </TableShell>
              <Pager offset={offset} limit={LIMIT} total={total} onChange={setOffset} />
            </>
          )}
        </div>

        <div className="lg:col-span-3">
          {selectedId ? (
            <Thread key={selectedId} id={selectedId} onChanged={() => void load()} />
          ) : (
            <div className="rounded-2xl border border-pj-slate-200 bg-white p-8">
              <Empty>Pick an enquiry on the left to read it.</Empty>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Thread({ id, onChanged }: { id: string; onChanged: () => void }) {
  const [enquiry, setEnquiry] = useState<EnquiryDetail | null>(null);
  const [replies, setReplies] = useState<EnquiryReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState<string | null>(null);
  /** Set when the last reply was saved but the email never went out. */
  const [notDelivered, setNotDelivered] = useState(false);
  const [busyStatus, setBusyStatus] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.adminEnquiry(id);
      setEnquiry(res.enquiry);
      setReplies(res.replies);
      setErr(null);
    } catch (e) {
      setErr(errText(e, "Could not open that enquiry."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const send = async () => {
    const body = draft.trim();
    if (!body) {
      setSendErr("Type a reply first.");
      return;
    }
    setSending(true);
    setSendErr(null);
    try {
      const res = await api.replyToEnquiry(id, body);
      setReplies((r) => [...r, res.reply]);
      setDraft("");
      setNotDelivered(!res.emailed);
      // Replying moves an open enquiry to 'answered' server-side; refresh both views.
      setEnquiry((e) => (e && e.status === "open" ? { ...e, status: "answered" } : e));
      onChanged();
    } catch (e) {
      setSendErr(errText(e, "The reply did not save. Nothing was sent."));
    } finally {
      setSending(false);
    }
  };

  const move = async (status: EnquiryStatus) => {
    setBusyStatus(true);
    try {
      const res = await api.setEnquiryStatus(id, status);
      setEnquiry(res.enquiry);
      onChanged();
    } catch (e) {
      setSendErr(errText(e, "Could not change the status."));
    } finally {
      setBusyStatus(false);
    }
  };

  if (loading && !enquiry) {
    return (
      <div className="rounded-2xl border border-pj-slate-200 bg-white p-8">
        <Loading />
      </div>
    );
  }
  if (err || !enquiry) {
    return <ErrorNote onRetry={() => void load()}>{err ?? "Enquiry not found."}</ErrorNote>;
  }

  return (
    <div className="rounded-2xl border border-pj-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-pj-slate-900">{enquiry.subject || "(no subject)"}</h3>
          <p className="text-sm text-pj-slate-500">
            {enquiry.name || "Someone"}
            {enquiry.user_name && enquiry.user_name !== enquiry.name ? ` (account: ${enquiry.user_name})` : ""} ·{" "}
            {enquiry.email || "no email"}
            {enquiry.phone ? ` · ${enquiry.phone}` : ""}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <Badge color={STATUS_COLOR[enquiry.status]}>{enquiry.status}</Badge>
            <Badge color="slate">via {enquiry.source}</Badge>
            {enquiry.assigned_to_name && <Badge color="blue">{enquiry.assigned_to_name}</Badge>}
            <span className="text-xs text-pj-slate-400">{fmtDateTime(enquiry.created_at)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {enquiry.status !== "closed" ? (
            <Button size="sm" variant="outline" disabled={busyStatus} onClick={() => move("closed")}>
              Close
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled={busyStatus} onClick={() => move("open")}>
              Reopen
            </Button>
          )}
        </div>
      </div>

      {/* No email means a reply can only ever be recorded — say so before it is typed. */}
      {!enquiry.email && (
        <p className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
          No email address on this enquiry. A reply here can only ever be recorded
          {enquiry.user_id
            ? " and mirrored to them as an in-app notification."
            : " — and they have no account either, so they would never see it."}{" "}
          Reach them another way.
        </p>
      )}

      <div className="mt-5 space-y-3">
        <div className="rounded-xl bg-pj-slate-50 border border-pj-slate-200 p-4">
          <div className="text-xs font-semibold text-pj-slate-500 mb-1">
            {enquiry.name || "Someone"} · {fmtDateTime(enquiry.created_at)}
          </div>
          <p className="text-sm text-pj-slate-900 whitespace-pre-wrap">{enquiry.message}</p>
        </div>

        {replies.map((r) => (
          <div key={r.id} className="rounded-xl bg-pj-blue-50 border border-pj-blue-100 p-4 ml-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <span className="text-xs font-semibold text-pj-blue-700">
                {r.admin_name || "Admin"} · {fmtDateTime(r.created_at)}
              </span>
              {r.emailed_at ? (
                <span className="text-xs text-pj-slate-500">emailed {timeAgo(r.emailed_at)}</span>
              ) : (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
                  saved — never emailed
                </span>
              )}
            </div>
            <p className="text-sm text-pj-slate-900 whitespace-pre-wrap">{r.body}</p>
          </div>
        ))}
      </div>

      {notDelivered && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-bold text-amber-800">Your reply was saved, but it was not emailed.</p>
          <p className="text-sm text-amber-700 mt-1">
            {enquiry.email
              ? "The mail service refused it or is not configured, so nothing left the building."
              : "There is no email address on this enquiry, so there was nowhere to send it."}{" "}
            {enquiry.user_id
              ? "They will see it in the app as a notification."
              : "They have no account either — they have not been told anything."}{" "}
            Follow up by phone if it matters.
          </p>
        </div>
      )}

      {enquiry.status === "closed" && (
        <p className="mt-5 text-sm text-pj-slate-500">
          This thread is closed. A reply is still recorded and sent, and it stays closed.
        </p>
      )}

      <div className="mt-5 border-t border-pj-slate-200 pt-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          maxLength={5000}
          placeholder={`Reply to ${enquiry.name || "them"}…`}
          className={inputClass}
        />
        {sendErr && <p className="text-sm text-red-600 mt-2">{sendErr}</p>}
        <div className="flex items-center gap-3 mt-3">
          <Button disabled={sending || !draft.trim()} onClick={send}>
            {sending ? "Sending…" : enquiry.email ? "Send reply" : "Save reply"}
          </Button>
          {sending && <Spinner />}
          <span className="text-xs text-pj-slate-400">
            {enquiry.email ? `Emailed to ${enquiry.email}` : "Recorded only — no email address on file"}
          </span>
        </div>
      </div>
    </div>
  );
}
