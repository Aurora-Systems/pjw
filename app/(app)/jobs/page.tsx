"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../lib/api";
import { Card, Badge, PageHeader, Loading, Empty } from "../../components/ui";
import Button from "../../components/Button";
import type { Job } from "../../lib/types";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.myJobs().then(({ jobs }) => {
      setJobs(jobs);
      setLoading(false);
    });
  }, []);

  const cancelJob = async (id: string) => {
    if (!window.confirm("Cancel this job? Providers will no longer be able to bid.")) return;
    try {
      await api.cancelJob(id);
      setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status: "cancelled" } : j)));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not cancel the job.");
    }
  };

  if (loading) return <Loading />;
  return (
    <>
      <PageHeader title="My jobs" subtitle="Track posts and review bids." action={<Button href="/post-job">Post a job</Button>} />
      {jobs.length === 0 ? (
        <Empty>You haven&apos;t posted any jobs yet.</Empty>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {jobs.map((j) => (
            <Card key={j.id}>
              <Link href={`/jobs/${j.id}`} className="block">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-pj-slate-900">{j.title}</div>
                    <div className="text-sm text-pj-slate-500">
                      {[j.category, j.budget_min && `$${j.budget_min}–${j.budget_max}`].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <Badge color={j.status === "open" ? "blue" : j.status === "assigned" ? "amber" : "slate"}>{j.status}</Badge>
                </div>
                <div className="text-sm text-pj-slate-500 mt-3">
                  {j.bid_count ?? 0} {j.bid_count === 1 ? "bid" : "bids"}
                  {(j.workers_needed ?? 1) > 1 && ` · hired ${j.hired_count ?? 0} of ${j.workers_needed}`} →
                </div>
              </Link>
              {/* A partially staffed multi-hire job is still 'open', so gate on hired_count too —
                  once anyone is hired the job is cancelled through their booking (which refunds
                  the provider's commission), not from here. */}
              {j.status === "open" && (j.hired_count ?? 0) === 0 && (
                <button
                  onClick={() => cancelJob(j.id)}
                  className="mt-3 text-sm font-medium text-red-600 hover:underline"
                >
                  Cancel job
                </button>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
