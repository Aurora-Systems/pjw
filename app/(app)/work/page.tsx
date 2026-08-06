"use client";

import { useEffect, useState, useCallback } from "react";
import { api, ApiError } from "../../lib/api";
import { Card, Badge, PageHeader, Loading, Empty, Field, inputClass } from "../../components/ui";
import Button from "../../components/Button";
import CategoryPicker from "../../components/CategoryPicker";
import type { Category, OpenJob } from "../../lib/types";

export default function WorkPage() {
  const [jobs, setJobs] = useState<OpenJob[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState<string>();
  // The feed shows every trade by default so it never opens empty; "my trade" is an opt-in filter.
  const [mineOnly, setMineOnly] = useState(false);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [offerJob, setOfferJob] = useState<OpenJob | null>(null);

  useEffect(() => {
    api.categories().then((c) => setCategories(c.categories));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const { jobs } = await api.providerOpenJobs({ category, q: q || undefined, mine: mineOnly });
    setJobs(jobs);
    setLoading(false);
  }, [category, q, mineOnly]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const selectedName = category ? categories.find((c) => c.slug === category)?.name : undefined;
  const tradeLabel = selectedName ?? (mineOnly ? "My trade" : "All trades");

  return (
    <>
      <PageHeader title="Available jobs" subtitle="Make an offer on open jobs near you." />

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className={`${inputClass} mb-3`}
        placeholder="Search jobs — e.g. “leaking tap”, “painting”…"
        aria-label="Search available jobs"
      />

      {/* Trade filter: a searchable, grouped picker — listing all 70 trades as chips was unusable. */}
      <details className="mb-6 rounded-xl border border-pj-slate-200" open={!!category}>
        <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-pj-slate-700">
          <span>Trade: {tradeLabel}</span>
          <span className="text-pj-slate-400">Change</span>
        </summary>
        <div className="border-t border-pj-slate-100 p-3">
          {/* One-tap shortcut to the provider's own trade; the picker below covers every other trade. */}
          <button
            type="button"
            onClick={() => { setCategory(undefined); setMineOnly(!mineOnly); }}
            className={`mb-3 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              mineOnly
                ? "bg-pj-blue-600 text-white"
                : "bg-pj-blue-50 text-pj-blue-700 hover:bg-pj-blue-100"
            }`}
          >
            {mineOnly ? "✓ Showing my trade only" : "Show only my trade"}
          </button>
          <CategoryPicker
            categories={categories}
            value={category}
            onChange={(slug) => {
              setCategory(slug);
              // Picking any trade (or clearing to "all") leaves the my-trade-only shortcut behind.
              setMineOnly(false);
            }}
            includeAll
            allLabel="All trades"
            placeholder="Search trades…"
          />
        </div>
      </details>

      {loading ? (
        <Loading />
      ) : jobs.length === 0 ? (
        <Empty>
          {q
            ? `No open jobs match “${q}”.`
            : mineOnly || category
              ? "No open jobs in that trade right now — switch to “All trades” to see everything."
              : "No open jobs right now."}
        </Empty>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {jobs.map((j) => (
            <Card key={j.id}>
              <div className="flex justify-between">
                <div className="flex gap-2">
                  {j.category && <Badge>{j.category}</Badge>}
                  {(j.workers_needed ?? 1) > 1 && (
                    <Badge color="amber">
                      {Math.max(0, (j.workers_needed ?? 1) - (j.hired_count ?? 0))} of {j.workers_needed} slots left
                    </Badge>
                  )}
                </div>
                <span className="font-extrabold text-pj-slate-900">${j.budget_min ?? "?"}–{j.budget_max ?? "?"}</span>
              </div>
              <div className="font-semibold text-pj-slate-900 mt-2">{j.title}</div>
              {j.description && <p className="text-sm text-pj-slate-500 mt-1 line-clamp-2">{j.description}</p>}
              <div className="text-sm text-pj-slate-400 mt-2">
                {[
                  j.customer_name + (j.customer_rating ? ` ★ ${Number(j.customer_rating).toFixed(1)} (${j.customer_reviews_count ?? 0})` : " · New client"),
                  j.location,
                  `${j.bid_count} ${j.bid_count === 1 ? "offer" : "offers"}`,
                ].filter(Boolean).join(" · ")}
              </div>
              <div className="mt-4">
                {/* A multi-hire job stays open after a hire, so this provider may already have won it. */}
                {j.i_am_hired ? (
                  <Badge color="green">You&apos;re hired</Badge>
                ) : j.has_my_bid ? (
                  <Badge color="green">Offer sent</Badge>
                ) : (
                  <Button size="sm" onClick={() => setOfferJob(j)}>Make an offer</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {offerJob && <OfferModal job={offerJob} onClose={() => setOfferJob(null)} onDone={() => { setOfferJob(null); load(); }} />}
    </>
  );
}

const BOOST_FEE = 0.5;

function OfferModal({ job, onClose, onDone }: { job: OpenJob; onClose: () => void; onDone: () => void }) {
  const [price, setPrice] = useState("");
  const [when, setWhen] = useState("Today");
  const [message, setMessage] = useState("");
  const [boost, setBoost] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // Boosting spends real wallet money, so it gets an explicit confirm before anything is charged.
  const [confirmingBoost, setConfirmingBoost] = useState(false);

  const send = async () => {
    setBusy(true);
    setErr(null);
    try {
      await api.submitBid(job.id, { price: Number(price), start_text: when, message: message || undefined, boosted: boost });
      onDone();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not send your offer.");
      setBusy(false);
      setConfirmingBoost(false);
    }
  };

  const submit = () => {
    if (!price) return setErr("Enter your price.");
    if (boost) return setConfirmingBoost(true);
    void send();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        {confirmingBoost ? (
          <>
            <h3 className="text-lg font-bold text-pj-slate-900">Boost this offer for ${BOOST_FEE.toFixed(2)}?</h3>
            <p className="text-sm text-pj-slate-500 mt-2">
              ${BOOST_FEE.toFixed(2)} will be deducted from your PocketJobs wallet. Your offer appears at
              the top of this job&apos;s list for 1 hour.
            </p>
            {err && <p className="text-sm text-red-600 mt-3">{err}</p>}
            <div className="flex gap-2 mt-5">
              <Button className="flex-1" disabled={busy} onClick={send}>
                {busy ? "Sending…" : `Confirm — $${BOOST_FEE.toFixed(2)}`}
              </Button>
              <Button variant="ghost" disabled={busy} onClick={() => setConfirmingBoost(false)}>Cancel</Button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-lg font-bold text-pj-slate-900">Your offer</h3>
            <p className="text-sm text-pj-slate-500 mb-4">{job.title} · budget ${job.budget_min ?? "?"}–{job.budget_max ?? "?"}</p>
            <div className="space-y-4">
              <Field label="Your price ($)"><input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} /></Field>
              <Field label="When can you start?"><input value={when} onChange={(e) => setWhen(e.target.value)} className={inputClass} /></Field>
              <Field label="Message (optional)"><textarea value={message} onChange={(e) => setMessage(e.target.value)} className={inputClass} rows={2} /></Field>
              <label className="flex items-center gap-2 text-sm text-pj-slate-700">
                <input type="checkbox" checked={boost} onChange={(e) => setBoost(e.target.checked)} className="h-4 w-4 rounded border-pj-slate-300 text-pj-blue-600" />
                ⚡ Boost this offer (+${BOOST_FEE.toFixed(2)}) — appears at top for 1 hour
              </label>
              {err && <p className="text-sm text-red-600">{err}</p>}
              <div className="flex gap-2">
                <Button className="flex-1" disabled={busy} onClick={submit}>{busy ? "Sending…" : "Send offer"}</Button>
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
