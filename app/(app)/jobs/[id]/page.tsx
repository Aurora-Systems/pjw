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

  useEffect(() => {
    api.job(id).then(({ job, bids }) => {
      setJob(job);
      setBids(bids);
      setLoading(false);
    });
  }, [id]);

  const accept = async (bid: Bid) => {
    setAccepting(bid.id);
    setErr(null);
    try {
      await api.acceptBid(bid.id);
      router.push("/bookings");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not accept bid.");
      setAccepting(null);
    }
  };

  if (loading || !job) return <Loading />;
  return (
    <>
      <PageHeader title={job.title} subtitle={`${bids.length} ${bids.length === 1 ? "bid" : "bids"} · budget $${job.budget_min ?? "?"}–${job.budget_max ?? "?"}`} />
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
                  <div className="text-sm text-pj-slate-500">★ {b.rating ?? "—"} ({b.reviews_count ?? 0}) · {b.start_text}</div>
                </div>
                <div className="text-xl font-extrabold text-pj-slate-900">${b.price}</div>
              </div>
              {b.message && <p className="text-sm text-pj-slate-600 mt-2">{b.message}</p>}
              <Button className="w-full mt-4" disabled={accepting !== null || b.status !== "pending"} onClick={() => accept(b)}>
                {accepting === b.id ? "Accepting…" : b.status === "accepted" ? "Accepted" : "Accept bid"}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
