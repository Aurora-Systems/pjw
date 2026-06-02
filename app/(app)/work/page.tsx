"use client";

import { useEffect, useState, useCallback } from "react";
import { api, ApiError } from "../../lib/api";
import { Card, Badge, PageHeader, Loading, Empty, Field, inputClass } from "../../components/ui";
import Button from "../../components/Button";
import type { Category, OpenJob } from "../../lib/types";

export default function WorkPage() {
  const [jobs, setJobs] = useState<OpenJob[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [bidJob, setBidJob] = useState<OpenJob | null>(null);

  useEffect(() => {
    api.categories().then((c) => setCategories(c.categories));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const { jobs } = await api.providerOpenJobs(category);
    setJobs(jobs);
    setLoading(false);
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader title="Available jobs" subtitle="Bid on open jobs near you." />
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setCategory(undefined)} className={chip(!category)}>All trades</button>
        {categories.map((c) => (
          <button key={c.id} onClick={() => setCategory(c.slug)} className={chip(category === c.slug)}>{c.name}</button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : jobs.length === 0 ? (
        <Empty>No open jobs in this trade right now.</Empty>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {jobs.map((j) => (
            <Card key={j.id}>
              <div className="flex justify-between">
                <div className="flex gap-2">{j.category && <Badge>{j.category}</Badge>}</div>
                <span className="font-extrabold text-pj-slate-900">${j.budget_min ?? "?"}–{j.budget_max ?? "?"}</span>
              </div>
              <div className="font-semibold text-pj-slate-900 mt-2">{j.title}</div>
              {j.description && <p className="text-sm text-pj-slate-500 mt-1 line-clamp-2">{j.description}</p>}
              <div className="text-sm text-pj-slate-400 mt-2">
                {[j.customer_name, j.location, `${j.bid_count} bids`].filter(Boolean).join(" · ")}
              </div>
              <div className="mt-4">
                {j.has_my_bid ? (
                  <Badge color="green">Bid submitted</Badge>
                ) : (
                  <Button size="sm" onClick={() => setBidJob(j)}>Submit a bid</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {bidJob && <BidModal job={bidJob} onClose={() => setBidJob(null)} onDone={() => { setBidJob(null); load(); }} />}
    </>
  );
}

function BidModal({ job, onClose, onDone }: { job: OpenJob; onClose: () => void; onDone: () => void }) {
  const [price, setPrice] = useState("");
  const [when, setWhen] = useState("Today");
  const [message, setMessage] = useState("");
  const [boost, setBoost] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!price) return setErr("Enter your price.");
    setBusy(true);
    setErr(null);
    try {
      await api.submitBid(job.id, { price: Number(price), start_text: when, message: message || undefined, boosted: boost });
      onDone();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not submit bid.");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-pj-slate-900">Your bid</h3>
        <p className="text-sm text-pj-slate-500 mb-4">{job.title} · budget ${job.budget_min ?? "?"}–{job.budget_max ?? "?"}</p>
        <div className="space-y-4">
          <Field label="Your price ($)"><input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} /></Field>
          <Field label="When can you start?"><input value={when} onChange={(e) => setWhen(e.target.value)} className={inputClass} /></Field>
          <Field label="Message (optional)"><textarea value={message} onChange={(e) => setMessage(e.target.value)} className={inputClass} rows={2} /></Field>
          <label className="flex items-center gap-2 text-sm text-pj-slate-700">
            <input type="checkbox" checked={boost} onChange={(e) => setBoost(e.target.checked)} className="h-4 w-4 rounded border-pj-slate-300 text-pj-blue-600" />
            ⚡ Boost this bid (+$0.50) — appears at top for 1 hour
          </label>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="flex gap-2">
            <Button className="flex-1" disabled={busy} onClick={submit}>{busy ? "Sending…" : "Send bid"}</Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function chip(active: boolean) {
  return `rounded-full px-4 py-1.5 text-sm font-medium border transition ${active ? "bg-pj-blue-600 border-pj-blue-600 text-white" : "bg-white border-pj-slate-200 text-pj-slate-600 hover:border-pj-slate-300"}`;
}
