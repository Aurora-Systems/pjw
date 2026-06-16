"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Card, Stat, PageHeader, Loading, Empty } from "../../components/ui";
import Button from "../../components/Button";
import type { Wallet } from "../../lib/types";

export default function WalletPage() {
  const [data, setData] = useState<Wallet | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.wallet().then(setData);
  }, []);

  if (!data) return <Loading />;

  const ratePct = Math.round(data.commission_rate * 100);
  const positive = data.balance > 0;

  const topup = async (amount: number) => {
    setErr(null);
    setBusy(amount);
    try {
      const { redirectUrl } = await api.topup(amount);
      window.location.assign(redirectUrl); // hand off to Pesepay; /payment/return reconciles
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not start top-up.");
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader title="Wallet" subtitle="Top up to take jobs. PocketJobs takes a commission per job from your balance." />

      <Card className="mb-6">
        <div className="text-xs uppercase tracking-wide text-pj-slate-400">Balance</div>
        <div className={`text-4xl font-extrabold ${positive ? "text-pj-slate-900" : "text-red-600"}`}>
          ${data.balance.toFixed(2)}
        </div>
        <p className="text-sm text-pj-slate-500 mt-1">
          {positive
            ? `You can accept jobs. PocketJobs takes ${ratePct}% per job from this balance.`
            : `Top up to start accepting jobs. PocketJobs takes ${ratePct}% per job from this balance.`}
        </p>
        {!positive && (
          <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3">
            Your balance is {data.balance < 0 ? "negative" : "empty"}. Add funds to bid for and accept jobs.
          </div>
        )}
      </Card>

      <h2 className="text-lg font-bold text-pj-slate-900 mb-3">Top up</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
        {data.packages.map((amt) => (
          <Button key={amt} variant="outline" disabled={busy !== null} onClick={() => topup(amt)}>
            {busy === amt ? "Starting…" : `$${amt}`}
          </Button>
        ))}
      </div>
      {err && <p className="text-sm text-red-600 mb-2">{err}</p>}
      <p className="text-xs text-pj-slate-400 mb-8">Paid securely via Pesepay. Top-ups are non-refundable.</p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Stat value={data.completed_jobs} label="Completed jobs" />
        <Stat value={`$${data.completed_value}`} label="Completed value (cash, paid to you directly)" />
      </div>

      <h2 className="text-lg font-bold text-pj-slate-900 mb-3">Activity</h2>
      {data.transactions.length === 0 ? (
        <Empty>No wallet activity yet.</Empty>
      ) : (
        <div className="space-y-3">
          {data.transactions.map((t) => {
            const credit = Number(t.amount) >= 0;
            return (
              <Card key={t.id} className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-pj-slate-900">
                    {t.description || (t.type === "topup" ? "Top-up" : "Commission")}
                  </div>
                  <div className="text-sm text-pj-slate-500">{new Date(t.created_at).toLocaleString()}</div>
                </div>
                <div className={`font-bold ${credit ? "text-emerald-600" : "text-red-600"}`}>
                  {credit ? "+" : ""}${Number(t.amount).toFixed(2)}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
