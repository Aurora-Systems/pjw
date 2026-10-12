"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import type {
  AudienceCounts,
  Broadcast,
  BroadcastAudience,
  BroadcastDraft,
  BroadcastProgress,
} from "../../lib/types";
import { Badge, Empty, Loading, inputClass } from "../ui";
import Button from "../Button";
import { ConfirmDialog, ErrorNote, FilterPills, TableShell, Td, Th, errText, timeAgo, useDebounced } from "./shared";

/**
 * Mass email to the platform's users.
 *
 * The admin writes once, previews the exact email, can send themselves a test, then
 * confirms. The server freezes the recipient list and this screen works through it a chunk
 * at a time, showing progress. Closing the tab only pauses the send: it can be resumed from
 * the history list, and nobody is emailed twice.
 */

const AUDIENCE_LABEL: Record<BroadcastAudience, string> = {
  all: "Everyone",
  customers: "Clients",
  providers: "Providers",
  corporate: "Businesses",
};

const DRAFT_KEY = "pj_broadcast_draft";
const EMPTY: BroadcastDraft = { audience: "all", subject: "", body: "", cta_label: "", cta_url: "", service_notice: false };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function loadDraft(): BroadcastDraft {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<BroadcastDraft>) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function statusBadge(status: Broadcast["status"], running: boolean) {
  if (running) return <Badge color="blue">Sending…</Badge>;
  if (status === "sent") return <Badge color="green">Sent</Badge>;
  if (status === "paused") return <Badge color="amber">Paused</Badge>;
  if (status === "cancelled") return <Badge color="slate">Stopped</Badge>;
  return <Badge color="amber">Not finished</Badge>;
}

export default function EmailTab() {
  // An unsent draft is restored, so a long message survives an accidental reload.
  const [draft, setDraft] = useState<BroadcastDraft>(loadDraft);
  const [counts, setCounts] = useState<AudienceCounts | null>(null);
  const [history, setHistory] = useState<Broadcast[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const [previewErr, setPreviewErr] = useState<string | null>(null);

  const [testTo, setTestTo] = useState("");
  const [testState, setTestState] = useState<{ busy: boolean; msg: string | null; ok: boolean }>({ busy: false, msg: null, ok: true });

  const [confirming, setConfirming] = useState(false);

  // The send currently being driven by this tab.
  const [runningId, setRunningId] = useState<string | null>(null);
  const runningRef = useRef<string | null>(null);
  const [progress, setProgress] = useState<BroadcastProgress | null>(null);
  const [runErr, setRunErr] = useState<string | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
  }, [draft]);

  const loadLists = useCallback(async () => {
    try {
      const [a, h] = await Promise.all([api.adminBroadcastAudiences(), api.adminBroadcasts()]);
      setCounts(a.audiences);
      setHistory(h.broadcasts);
      setLoadErr(null);
    } catch (e) {
      setLoadErr(errText(e, "Could not load email history."));
    }
  }, []);

  useEffect(() => {
    let alive = true;
    Promise.all([api.adminBroadcastAudiences(), api.adminBroadcasts()])
      .then(([a, h]) => {
        if (!alive) return;
        setCounts(a.audiences);
        setHistory(h.broadcasts);
      })
      .catch((e) => alive && setLoadErr(errText(e, "Could not load email history.")));
    return () => {
      alive = false;
    };
  }, []);

  // Live preview, rendered by the server's own email code, a moment after typing stops.
  const debounced = useDebounced(draft, 600);
  const hasContent = !!debounced.subject.trim() && !!debounced.body.trim();
  useEffect(() => {
    if (!hasContent) return;
    let cancelled = false;
    api
      .adminBroadcastPreview(debounced)
      .then((p) => {
        if (!cancelled) {
          setPreview(p);
          setPreviewErr(null);
        }
      })
      .catch((e) => !cancelled && setPreviewErr(errText(e)));
    return () => {
      cancelled = true;
    };
  }, [debounced, hasContent]);

  // Leaving mid-send only pauses it, but say so before the tab closes.
  useEffect(() => {
    if (!runningId) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [runningId]);

  const set = <K extends keyof BroadcastDraft>(key: K, value: BroadcastDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const audienceInfo = counts?.[draft.audience];
  const recipients = audienceInfo ? audienceInfo.reach + (draft.service_notice ? audienceInfo.unsubscribed : 0) : null;
  const ready = !!draft.subject.trim() && !!draft.body.trim() && !!recipients && !(hasContent && previewErr);

  /** Work through a broadcast chunk by chunk until it finishes, pauses or is stopped. */
  const run = useCallback(
    async (id: string) => {
      runningRef.current = id;
      setRunningId(id);
      setRunErr(null);
      let strikes = 0;
      while (runningRef.current === id) {
        try {
          const res = await api.adminBroadcastSend(id);
          strikes = 0;
          setProgress(res.progress);
          if (res.outcome === "done" || res.outcome === "stopped" || res.outcome === "paused") break;
          await sleep(res.outcome === "rate_limited" ? 2000 : 300);
        } catch (e) {
          // A few blips in a row are normal on a slow connection; more than that, stop and
          // let the admin resume, rather than hammering a server that is struggling.
          strikes += 1;
          if (strikes >= 4) {
            setRunErr(`${errText(e)} The send is paused. Resume it from the list below.`);
            break;
          }
          await sleep(2500);
        }
      }
      if (runningRef.current === id) runningRef.current = null;
      setRunningId(null);
      void loadLists();
    },
    [loadLists]
  );

  const start = async () => {
    const { broadcast } = await api.adminCreateBroadcast(draft);
    setDraft(EMPTY);
    setProgress({
      id: broadcast.id,
      status: "sending",
      status_note: null,
      total: broadcast.total,
      sent: 0,
      failed: 0,
      remaining: broadcast.total,
      finished_at: null,
    });
    void run(broadcast.id);
  };

  const stop = async (id: string) => {
    if (runningRef.current === id) runningRef.current = null;
    try {
      const { progress: p } = await api.adminBroadcastCancel(id);
      setProgress(p);
    } catch (e) {
      setRunErr(errText(e));
    }
    void loadLists();
  };

  const sendTest = async () => {
    setTestState({ busy: true, msg: null, ok: true });
    try {
      const res = await api.adminBroadcastTest(draft, testTo.trim() || null);
      setTestState({ busy: false, msg: `Test sent to ${res.sent_to}. Check that inbox (and its spam folder).`, ok: true });
    } catch (e) {
      setTestState({ busy: false, msg: errText(e), ok: false });
    }
  };

  if (!counts && !history && !loadErr) return <Loading />;

  const pct = progress && progress.total > 0 ? Math.round(((progress.sent + progress.failed) / progress.total) * 100) : 0;

  return (
    <div className="space-y-8">
      {loadErr && <ErrorNote onRetry={() => void loadLists()}>{loadErr}</ErrorNote>}

      {/* ── Current / last send ─────────────────────────────────────────── */}
      {progress && (
        <div className="rounded-2xl border border-pj-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-pj-slate-900">
                {runningId === progress.id
                  ? "Sending…"
                  : progress.status === "sent"
                    ? "Finished"
                    : progress.status === "paused"
                      ? "Paused"
                      : progress.status === "cancelled"
                        ? "Stopped"
                        : "Not finished"}
              </p>
              <p className="text-sm text-pj-slate-500">
                Sent {progress.sent} of {progress.total}
                {progress.failed > 0 && ` · ${progress.failed} failed`}
                {progress.remaining > 0 && runningId !== progress.id && progress.status !== "cancelled" &&
                  ` · ${progress.remaining} still to go`}
              </p>
            </div>
            <div className="flex gap-2">
              {runningId === progress.id ? (
                <Button variant="outline" size="sm" onClick={() => stop(progress.id)}>
                  Stop sending
                </Button>
              ) : (
                (progress.status === "paused" || (progress.status === "sending" && progress.remaining > 0)) && (
                  <Button size="sm" onClick={() => run(progress.id)}>
                    Resume
                  </Button>
                )
              )}
            </div>
          </div>
          <div className="mt-4 h-2 rounded-full bg-pj-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-pj-blue-600 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          {runningId === progress.id && (
            <p className="mt-3 text-xs text-pj-slate-400">
              Keep this tab open until it finishes. If you close it, the send pauses and you can resume it below.
            </p>
          )}
          {progress.status_note && <p className="mt-3 text-sm text-amber-700">{progress.status_note}</p>}
          {runErr && <p className="mt-3 text-sm text-red-600">{runErr}</p>}
        </div>
      )}

      {/* ── Compose ─────────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-pj-slate-700 mb-2">Who gets it</p>
            <FilterPills
              options={(Object.keys(AUDIENCE_LABEL) as BroadcastAudience[]).map((a) => ({
                value: a,
                label: AUDIENCE_LABEL[a],
                count: counts ? counts[a].reach + (draft.service_notice ? counts[a].unsubscribed : 0) : undefined,
              }))}
              value={draft.audience}
              onChange={(a) => set("audience", a)}
            />
            {audienceInfo && audienceInfo.unsubscribed > 0 && (
              <p className="mt-2 text-xs text-pj-slate-400">
                {draft.service_notice
                  ? `Includes ${audienceInfo.unsubscribed} people who unsubscribed, because this is a required notice.`
                  : `${audienceInfo.unsubscribed} unsubscribed and will be skipped.`}
              </p>
            )}
          </div>

          <label className="block">
            <span className="block text-sm font-semibold text-pj-slate-700 mb-1">Subject</span>
            <input
              value={draft.subject}
              onChange={(e) => set("subject", e.target.value)}
              maxLength={150}
              placeholder="What's new on PocketJobs"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="block text-sm font-semibold text-pj-slate-700 mb-1">Message</span>
            <textarea
              value={draft.body}
              onChange={(e) => set("body", e.target.value)}
              rows={12}
              maxLength={10000}
              placeholder={"Hi {{first_name}},\n\n…\n\nThe PocketJobs team"}
              className={inputClass}
            />
            <span className="block text-xs text-pj-slate-400 mt-1">
              Write it as plain text. {"{{first_name}}"} becomes each person&apos;s first name, and web
              addresses become links.
            </span>
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-sm font-semibold text-pj-slate-700 mb-1">Button text (optional)</span>
              <input
                value={draft.cta_label ?? ""}
                onChange={(e) => set("cta_label", e.target.value)}
                maxLength={40}
                placeholder="Post a job"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="block text-sm font-semibold text-pj-slate-700 mb-1">Button link</span>
              <input
                value={draft.cta_url ?? ""}
                onChange={(e) => set("cta_url", e.target.value)}
                placeholder="https://pocketjobs.co/post-job"
                className={inputClass}
              />
            </label>
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-pj-slate-200 p-3.5 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.service_notice}
              onChange={(e) => set("service_notice", e.target.checked)}
              className="mt-1 h-4 w-4 accent-pj-blue-600"
            />
            <span>
              <span className="block text-sm font-semibold text-pj-slate-800">Required service notice</span>
              <span className="block text-xs text-pj-slate-500 mt-0.5 leading-relaxed">
                Also sends to people who unsubscribed. Use it only for things everyone must know about
                their account, like a change to the terms or a security issue, never for news or promotions.
              </span>
            </span>
          </label>

          {/* Test, then send */}
          <div className="rounded-xl bg-pj-slate-50 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                placeholder="Test address (blank = your own email)"
                className={`${inputClass} flex-1`}
              />
              <Button variant="outline" onClick={sendTest} disabled={!ready || testState.busy}>
                {testState.busy ? "Sending…" : "Send a test"}
              </Button>
            </div>
            {testState.msg && (
              <p className={`text-sm ${testState.ok ? "text-emerald-700" : "text-red-600"}`}>{testState.msg}</p>
            )}
            <Button className="w-full" onClick={() => setConfirming(true)} disabled={!ready || !!runningId}>
              {recipients ? `Send to ${recipients} ${recipients === 1 ? "person" : "people"}` : "Send"}
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div>
          <p className="text-sm font-semibold text-pj-slate-700 mb-2">Preview</p>
          <div className="rounded-2xl border border-pj-slate-200 overflow-hidden bg-white">
            {preview && hasContent ? (
              <>
                <div className="px-4 py-3 border-b border-pj-slate-100 text-sm">
                  <span className="text-pj-slate-400">Subject: </span>
                  <span className="font-semibold text-pj-slate-900">{preview.subject}</span>
                </div>
                {/* The real email HTML. Scripts stay blocked (no allow-scripts), so nothing in it can
                    run or reach this page; allow-same-origin is only there because a fully opaque
                    sandbox rendered blank in testing. */}
                <iframe
                  title="Email preview"
                  srcDoc={preview.html}
                  sandbox="allow-same-origin"
                  className="w-full h-[560px] bg-white"
                />
              </>
            ) : (
              <div className="h-[600px] flex items-center justify-center px-8 text-center text-sm text-pj-slate-400">
                {(hasContent && previewErr) || "Add a subject and a message to see the email as people will receive it."}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── History ─────────────────────────────────────────────────────── */}
      <div>
        <h3 className="text-base font-bold text-pj-slate-900 mb-3">Sent emails</h3>
        {!history || history.length === 0 ? (
          <Empty>No mass emails yet.</Empty>
        ) : (
          <TableShell>
            <thead>
              <tr>
                <Th>Subject</Th>
                <Th>Audience</Th>
                <Th>Status</Th>
                <Th>Sent</Th>
                <Th>Started</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {history.map((b) => {
                const running = runningId === b.id;
                const unfinished = b.status === "paused" || b.status === "sending";
                return (
                  <tr key={b.id} className="border-t border-pj-slate-100">
                    <Td>
                      <div className="font-semibold text-pj-slate-900">{b.subject}</div>
                      {b.service_notice && <div className="text-xs text-pj-slate-400">Required notice</div>}
                      {b.status_note && <div className="text-xs text-amber-700 mt-0.5">{b.status_note}</div>}
                    </Td>
                    <Td>{AUDIENCE_LABEL[b.audience]}</Td>
                    <Td>{statusBadge(b.status, running)}</Td>
                    <Td>
                      {b.sent_count} / {b.total}
                      {b.failed_count > 0 && <div className="text-xs text-red-600">{b.failed_count} failed</div>}
                    </Td>
                    <Td>
                      <div>{timeAgo(b.created_at)}</div>
                      {b.created_by_name && <div className="text-xs text-pj-slate-400">by {b.created_by_name}</div>}
                    </Td>
                    <Td className="text-right whitespace-nowrap">
                      {unfinished && !running && !runningId && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => run(b.id)}>
                            Resume
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => stop(b.id)}>
                            Stop
                          </Button>
                        </div>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
        )}
      </div>

      {confirming && (
        <ConfirmDialog
          title={`Email ${recipients} ${recipients === 1 ? "person" : "people"}?`}
          confirmLabel="Send now"
          showReason={false}
          onClose={() => setConfirming(false)}
          onConfirm={start}
        >
          <p className="text-pj-slate-700 font-semibold">{draft.subject}</p>
          <p>
            To {AUDIENCE_LABEL[draft.audience].toLowerCase()}
            {draft.service_notice ? ", including people who unsubscribed (required notice)" : ""}. Emails start
            going out straight away and can&apos;t be recalled. You can stop it part-way.
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}
