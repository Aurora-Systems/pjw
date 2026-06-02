"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Card, Stat, Badge, PageHeader, Loading, Empty } from "../../components/ui";
import Button from "../../components/Button";
import type { AdminMetrics, VerificationItem, Dispute } from "../../lib/types";

export default function AdminPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [queue, setQueue] = useState<VerificationItem[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [m, v, d] = await Promise.all([api.adminMetrics(), api.adminVerifications(), api.adminDisputes()]);
    setMetrics(m);
    setQueue(v.queue);
    setDisputes(d.disputes);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const review = async (id: string, action: "approve" | "reject") => {
    await api.reviewVerification(id, action);
    setQueue((q) => q.filter((x) => x.id !== id));
    if (metrics) setMetrics({ ...metrics, pending_verifications: Math.max(0, metrics.pending_verifications - 1) });
  };
  const resolve = async (id: string) => {
    await api.resolveDispute(id);
    setDisputes((d) => d.map((x) => (x.id === id ? { ...x, status: "resolved" } : x)));
  };

  if (loading || !metrics) return <Loading />;
  return (
    <>
      <PageHeader title="Moderation" subtitle="Verification queue, disputes and live metrics." />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Stat value={metrics.active_users} label="Active users" />
        <Stat value={metrics.jobs_today} label="Jobs today" />
        <Stat value={metrics.open_disputes} label="Open disputes" />
        <Stat value={metrics.pending_verifications} label="Pending verif." />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-bold text-pj-slate-900 mb-3">Verification queue ({queue.length})</h2>
          {queue.length === 0 ? (
            <Empty>Queue clear 🎉</Empty>
          ) : (
            <div className="space-y-3">
              {queue.map((p) => (
                <Card key={p.id}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-pj-slate-900">{p.full_name}</div>
                      <div className="text-sm text-pj-slate-500">{p.primary_category ?? "provider"} · {p.email}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => review(p.id, "reject")}>Reject</Button>
                      <Button size="sm" onClick={() => review(p.id, "approve")}>Approve</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-bold text-pj-slate-900 mb-3">Disputes</h2>
          <div className="space-y-3">
            {disputes.map((d) => (
              <Card key={d.id} className="border-l-4 border-l-red-400">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-pj-slate-900">#{d.id}</div>
                    <div className="text-sm text-pj-slate-500">{d.reason} · {d.category} · ${d.amount}</div>
                  </div>
                  {d.status === "open" ? (
                    <Button size="sm" onClick={() => resolve(d.id)}>Resolve</Button>
                  ) : (
                    <Badge color="green">resolved</Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
