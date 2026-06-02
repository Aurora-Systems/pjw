"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Card, Stat, PageHeader, Loading, Empty } from "../../components/ui";
import Button from "../../components/Button";
import type { Earnings } from "../../lib/types";

export default function EarningsPage() {
  const [data, setData] = useState<Earnings | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    api.providerEarnings().then(setData);
  }, []);

  if (!data) return <Loading />;
  return (
    <>
      <PageHeader title="Earnings" subtitle="Payouts and completed jobs." />
      <Card className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-pj-slate-400">Available to withdraw</div>
          <div className="text-4xl font-extrabold text-pj-slate-900">${data.available}</div>
        </div>
        <Button onClick={() => setMsg("Withdrawal to EcoCash requested.")}>Withdraw to EcoCash</Button>
      </Card>
      {msg && <p className="text-sm text-emerald-600 mb-4">{msg}</p>}

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Stat value={`$${data.this_month}`} label="This month" />
        <Stat value={data.month_jobs} label="Jobs" />
        <Stat value={`$${data.all_time}`} label="All time" />
      </div>

      <h2 className="text-lg font-bold text-pj-slate-900 mb-3">Recent payouts</h2>
      {data.recent.length === 0 ? (
        <Empty>No completed jobs yet.</Empty>
      ) : (
        <div className="space-y-3">
          {data.recent.map((r) => (
            <Card key={r.id} className="flex justify-between items-center">
              <div>
                <div className="font-semibold text-pj-slate-900">{r.service}</div>
                <div className="text-sm text-pj-slate-500">{r.customer_name} · {new Date(r.created_at).toLocaleDateString()}</div>
              </div>
              <div className="font-bold text-emerald-600">+${r.total}</div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
