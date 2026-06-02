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

  if (loading) return <Loading />;
  return (
    <>
      <PageHeader title="My jobs" subtitle="Track posts and review bids." action={<Button href="/post-job">Post a job</Button>} />
      {jobs.length === 0 ? (
        <Empty>You haven&apos;t posted any jobs yet.</Empty>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {jobs.map((j) => (
            <Link key={j.id} href={`/jobs/${j.id}`}>
              <Card>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-pj-slate-900">{j.title}</div>
                    <div className="text-sm text-pj-slate-500">
                      {[j.category, j.budget_min && `$${j.budget_min}–${j.budget_max}`].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <Badge color={j.status === "open" ? "blue" : j.status === "assigned" ? "amber" : "slate"}>{j.status}</Badge>
                </div>
                <div className="text-sm text-pj-slate-500 mt-3">{j.bid_count ?? 0} {j.bid_count === 1 ? "bid" : "bids"} →</div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
