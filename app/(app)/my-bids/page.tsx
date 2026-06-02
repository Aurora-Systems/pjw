"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Card, Badge, PageHeader, Loading, Empty } from "../../components/ui";
import type { MyBid } from "../../lib/types";

export default function MyBidsPage() {
  const [bids, setBids] = useState<MyBid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.providerBids().then(({ bids }) => {
      setBids(bids);
      setLoading(false);
    });
  }, []);

  if (loading) return <Loading />;
  return (
    <>
      <PageHeader title="My bids" subtitle="Track the jobs you've bid on." />
      {bids.length === 0 ? (
        <Empty>No bids yet. Browse available jobs to get started.</Empty>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {bids.map((b) => (
            <Card key={b.id}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-pj-slate-900">{b.job_title}</div>
                  <div className="text-sm text-pj-slate-500">${b.price} · {b.start_text}</div>
                </div>
                <Badge color={b.status === "accepted" ? "green" : b.status === "declined" ? "slate" : "amber"}>{b.status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
