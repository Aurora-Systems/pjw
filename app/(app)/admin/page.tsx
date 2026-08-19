"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Card, Stat, Badge, PageHeader, Loading, Empty } from "../../components/ui";
import Button from "../../components/Button";
import type { AdminMetrics, AdminUser, EnquiryCounts, VerificationItem, Dispute } from "../../lib/types";
import { ConfirmDialog, ErrorNote, errText, timeAgo } from "../../components/admin/shared";
import UsersTab from "../../components/admin/UsersTab";
import JobsTab from "../../components/admin/JobsTab";
import EnquiriesTab from "../../components/admin/EnquiriesTab";
import WalletTab, { type WalletTarget } from "../../components/admin/WalletTab";
import AuditTab from "../../components/admin/AuditTab";

const TAB_KEYS = ["users", "jobs", "verifications", "disputes", "enquiries", "wallet", "audit"] as const;
type TabKey = (typeof TAB_KEYS)[number];

const TAB_LABELS: Record<TabKey, string> = {
  users: "Users",
  jobs: "Jobs",
  verifications: "Verifications",
  disputes: "Disputes",
  enquiries: "Enquiries",
  wallet: "Wallet",
  audit: "Audit",
};

export default function AdminPage() {
  const [tab, setTab] = useState<TabKey>("users");

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [queue, setQueue] = useState<VerificationItem[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [enquiryCounts, setEnquiryCounts] = useState<EnquiryCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [headErr, setHeadErr] = useState<string | null>(null);

  /** Set when an admin jumps from a Users row into that person's wallet. */
  const [walletTarget, setWalletTarget] = useState<WalletTarget | null>(null);

  // The tab lives in the URL so a console view can be linked to and survives a reload,
  // read straight from location rather than useSearchParams (which would force a Suspense
  // boundary around a page that is client-rendered anyway).
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t && (TAB_KEYS as readonly string[]).includes(t)) setTab(t as TabKey);
  }, []);

  const openTab = useCallback((next: TabKey) => {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url.toString());
  }, []);

  /**
   * The header counters and the two original queues. Loaded with allSettled so one sick
   * endpoint leaves the rest of the console usable instead of spinning forever.
   */
  const load = useCallback(async () => {
    setLoading(true);
    const [m, v, d, e] = await Promise.allSettled([
      api.adminMetrics(),
      api.adminVerifications(),
      api.adminDisputes(),
      api.adminEnquiries({ limit: 1 }),
    ]);
    if (m.status === "fulfilled") setMetrics(m.value);
    if (v.status === "fulfilled") setQueue(v.value.queue);
    if (d.status === "fulfilled") setDisputes(d.value.disputes);
    if (e.status === "fulfilled") setEnquiryCounts(e.value.counts);

    const failed = [m, v, d, e].find((r) => r.status === "rejected");
    setHeadErr(failed ? errText(failed.reason, "Some of the console could not load.") : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (id: string, action: "approve" | "reject") => {
    await api.reviewVerification(id, action);
    setQueue((q) => q.filter((x) => x.id !== id));
    setMetrics((m) => (m ? { ...m, pending_verifications: Math.max(0, m.pending_verifications - 1) } : m));
  };
  const resolve = async (id: string) => {
    await api.resolveDispute(id);
    setDisputes((d) => d.map((x) => (x.id === id ? { ...x, status: "resolved" } : x)));
    setMetrics((m) => (m ? { ...m, open_disputes: Math.max(0, m.open_disputes - 1) } : m));
  };

  const openWallet = (u: AdminUser) => {
    setWalletTarget({ id: u.id, full_name: u.full_name, email: u.email, avatar_url: u.avatar_url });
    openTab("wallet");
  };

  const badges: Partial<Record<TabKey, number>> = {
    verifications: queue.length,
    disputes: disputes.filter((d) => d.status === "open").length,
    enquiries: enquiryCounts?.open ?? 0,
  };

  if (loading) return <Loading />;

  return (
    <>
      <PageHeader
        title="Operations"
        subtitle="People, jobs, money and the inbox — everything support and moderation touch."
      />

      {headErr && (
        <div className="mb-6">
          <ErrorNote onRetry={() => void load()}>{headErr}</ErrorNote>
        </div>
      )}

      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Stat value={metrics.active_users} label="Active users" />
          <Stat value={metrics.jobs_today} label="Jobs today" />
          <Stat value={metrics.open_disputes} label="Open disputes" />
          <Stat value={metrics.pending_verifications} label="Pending verif." />
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto border-b border-pj-slate-200 mb-6">
        {TAB_KEYS.map((key) => {
          const active = key === tab;
          const count = badges[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => openTab(key)}
              className={`shrink-0 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition cursor-pointer ${
                active
                  ? "border-pj-blue-600 text-pj-blue-600"
                  : "border-transparent text-pj-slate-500 hover:text-pj-slate-900"
              }`}
            >
              {TAB_LABELS[key]}
              {count ? (
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                    active ? "bg-pj-blue-50 text-pj-blue-700" : "bg-pj-slate-100 text-pj-slate-600"
                  }`}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {tab === "users" && <UsersTab onOpenWallet={openWallet} />}
      {tab === "jobs" && <JobsTab />}
      {tab === "verifications" && <VerificationsTab queue={queue} onReview={review} />}
      {tab === "disputes" && <DisputesTab disputes={disputes} onResolve={resolve} />}
      {tab === "enquiries" && <EnquiriesTab onCounts={setEnquiryCounts} />}
      {/* Keyed on the target so arriving from a Users row always lands on that wallet. */}
      {tab === "wallet" && <WalletTab key={walletTarget?.id ?? "none"} initialTarget={walletTarget} />}
      {tab === "audit" && <AuditTab />}
    </>
  );
}

/** The original verification queue: the admin-granted permission-to-work gate. */
function VerificationsTab({
  queue,
  onReview,
}: {
  queue: VerificationItem[];
  onReview: (id: string, action: "approve" | "reject") => Promise<void>;
}) {
  const [rejecting, setRejecting] = useState<VerificationItem | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const approve = async (p: VerificationItem) => {
    setBusy(p.id);
    setErr(null);
    try {
      await onReview(p.id, "approve");
    } catch (e) {
      setErr(errText(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <p className="text-sm text-pj-slate-500 mb-4 max-w-2xl">
        Approving here grants the <strong className="text-pj-slate-700">permission to work</strong> — it lets someone
        make offers. It is not the public Verified badge, which only a completed Didit ID check earns.
      </p>

      {err && (
        <div className="mb-4">
          <ErrorNote>{err}</ErrorNote>
        </div>
      )}

      {queue.length === 0 ? (
        <Empty>Queue clear 🎉</Empty>
      ) : (
        <div className="space-y-3 max-w-3xl">
          {queue.map((p) => (
            <Card key={p.id}>
              <div className="flex flex-wrap justify-between items-center gap-3">
                <div>
                  <div className="font-semibold text-pj-slate-900">{p.full_name}</div>
                  <div className="text-sm text-pj-slate-500">
                    {p.primary_category ?? "provider"} · {p.email}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={busy === p.id} onClick={() => setRejecting(p)}>
                    Reject
                  </Button>
                  <Button size="sm" disabled={busy === p.id} onClick={() => approve(p)}>
                    {busy === p.id ? "Working…" : "Approve"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {rejecting && (
        <ConfirmDialog
          title={`Reject ${rejecting.full_name}?`}
          confirmLabel="Reject"
          danger
          // The queue endpoint takes no reason, so don't pretend to record one.
          showReason={false}
          onClose={() => setRejecting(null)}
          onConfirm={async () => {
            await onReview(rejecting.id, "reject");
          }}
        >
          <p>They stay unable to bid on anything, and they drop out of this queue.</p>
          <p>They can be approved later from the Users tab if the situation changes.</p>
        </ConfirmDialog>
      )}
    </>
  );
}

/** The original dispute list. */
function DisputesTab({ disputes, onResolve }: { disputes: Dispute[]; onResolve: (id: string) => Promise<void> }) {
  const [resolving, setResolving] = useState<Dispute | null>(null);

  if (disputes.length === 0) return <Empty>No disputes. 🎉</Empty>;

  return (
    <>
      <div className="space-y-3 max-w-3xl">
        {disputes.map((d) => (
          <Card key={d.id} className={d.status === "open" ? "border-l-4 border-l-red-400" : ""}>
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <div className="font-semibold text-pj-slate-900">{d.reason}</div>
                <div className="text-sm text-pj-slate-500">
                  {d.category ?? "uncategorised"} · ${d.amount ?? "0"} · raised {timeAgo(d.created_at)}
                </div>
              </div>
              {d.status === "open" ? (
                <Button size="sm" onClick={() => setResolving(d)}>
                  Resolve
                </Button>
              ) : (
                <Badge color="green">resolved</Badge>
              )}
            </div>
          </Card>
        ))}
      </div>

      {resolving && (
        <ConfirmDialog
          title="Mark this dispute resolved?"
          confirmLabel="Resolve"
          showReason={false}
          onClose={() => setResolving(null)}
          onConfirm={async () => {
            await onResolve(resolving.id);
          }}
        >
          <p className="text-pj-slate-700 font-semibold">{resolving.reason}</p>
          <p>
            ${resolving.amount ?? "0"} · raised {timeAgo(resolving.created_at)}. Resolving only closes the ticket — it
            moves no money on its own. If a refund is owed, do it on the Wallet tab.
          </p>
        </ConfirmDialog>
      )}
    </>
  );
}
