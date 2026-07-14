"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "../../../lib/api";
import { Card, Badge, PageHeader, Loading, Empty } from "../../../components/ui";
import Button from "../../../components/Button";
import type { Bid, Job } from "../../../lib/types";

export default function JobBidsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = () =>
    api.job(id).then(({ job, bids }) => {
      setJob(job);
      setBids(bids);
      setLoading(false);
    });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const accept = async (bid: Bid) => {
    setAccepting(bid.id);
    setErr(null);
    try {
      const res = await api.acceptBid(bid.id);
      // Multi-hire: only leave the page once every slot is filled. Otherwise stay here so the
      // customer can keep hiring, and refresh to show the new progress + remaining bids.
      if (res.fully_staffed) {
        router.push("/bookings");
        return;
      }
      await load();
      setAccepting(null);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not accept bid.");
      setAccepting(null);
    }
  };

  if (loading || !job) return <Loading />;

  const needed = job.workers_needed ?? 1;
  const hired = job.hired_count ?? 0;
  const multi = needed > 1;
  const slotsLeft = Math.max(0, needed - hired);
  const fullyStaffed = slotsLeft === 0;

  return (
    <>
      <PageHeader
        title={job.title}
        subtitle={`${bids.length} ${bids.length === 1 ? "bid" : "bids"} · budget $${job.budget_min ?? "?"}–${job.budget_max ?? "?"}`}
      />

      {multi && (
        <Card className="mb-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-pj-slate-900">
                Hired {hired} of {needed}
              </div>
              <div className="text-sm text-pj-slate-500">
                {fullyStaffed
                  ? "This job is fully staffed."
                  : `${slotsLeft} ${slotsLeft === 1 ? "slot" : "slots"} left — accept another bid to hire more.`}
              </div>
            </div>
            <div className="flex gap-1.5" aria-hidden="true">
              {Array.from({ length: needed }, (_, i) => (
                <span
                  key={i}
                  className={`h-2.5 w-6 rounded-full ${i < hired ? "bg-pj-blue-600" : "bg-pj-slate-200"}`}
                />
              ))}
            </div>
          </div>
        </Card>
      )}

      {err && <p className="text-sm text-red-600 mb-4">{err}</p>}

      {bids.length === 0 ? (
        <Empty>No bids yet — nearby pros are being notified. Check back shortly.</Empty>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {bids.map((b, i) => (
            <Card key={b.id}>
              {i === 0 && b.boosted && <Badge color="amber">Recommended</Badge>}
              <div className="flex justify-between items-start mt-2">
                <div>
                  <div className="font-semibold text-pj-slate-900 flex items-center gap-2">
                    {b.provider_name}
                    {b.is_pro && <Badge color="green">Pro</Badge>}
                  </div>
                  <div className="text-sm text-pj-slate-500">
                    ★ {b.rating ?? "—"} ({b.reviews_count ?? 0}) · {b.start_text}
                  </div>
                </div>
                <div className="text-xl font-extrabold text-pj-slate-900">${b.price}</div>
              </div>
              {b.message && <p className="text-sm text-pj-slate-600 mt-2">{b.message}</p>}

              {b.status === "accepted" ? (
                <div className="mt-4 flex items-center justify-center rounded-xl bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-700">
                  Hired
                </div>
              ) : (
                <Button
                  className="w-full mt-4"
                  disabled={accepting !== null || b.status !== "pending" || fullyStaffed}
                  onClick={() => accept(b)}
                >
                  {accepting === b.id
                    ? "Hiring…"
                    : b.status === "declined"
                      ? "Declined"
                      : fullyStaffed
                        ? "Fully staffed"
                        : multi
                          ? "Hire this provider"
                          : "Accept bid"}
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      {multi && hired > 0 && (
        <div className="mt-6">
          <Button variant="outline" href="/bookings">
            View bookings ({hired} hired)
          </Button>
        </div>
      )}
    </>
  );
}
