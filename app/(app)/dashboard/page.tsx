"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../lib/auth-context";
import { api } from "../../lib/api";
import { Card, Stat, PageHeader, Badge, Loading, Empty, Avatar } from "../../components/ui";
import { TrendChart, BarBreakdown, StatTile, compact } from "../../components/charts";
import Button from "../../components/Button";
import type {
  Booking,
  Provider,
  ProviderDashboard,
  OpenJob,
  CorporateDashboard,
  AdminMetrics,
} from "../../lib/types";

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === "provider") return <ProviderHome />;
  if (user.role === "corporate") return <CorporateHome name={user.full_name} />;
  if (user.role === "admin") return <AdminHome />;
  return <CustomerHome name={user.full_name} />;
}

/* ---------------- Customer ---------------- */
function CustomerHome({ name }: { name: string }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.bookings(), api.providers({ sort: "rating" })]).then(([b, p]) => {
      setBookings(b.bookings);
      setProviders(p.providers.slice(0, 4));
      setLoading(false);
    });
  }, []);

  if (loading) return <Loading />;
  return (
    <>
      <PageHeader
        title={`Welcome back, ${name.split(" ")[0]}`}
        subtitle="Find trusted help or check on your bookings."
        action={<Button href="/post-job">Post a job</Button>}
      />
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Card onClick={() => (window.location.href = "/browse")} className="flex items-center justify-between">
          <div>
            <div className="font-bold text-pj-slate-900">Browse providers</div>
            <div className="text-sm text-pj-slate-500">Search by category and book directly</div>
          </div>
          <span className="text-pj-blue-600 text-2xl">→</span>
        </Card>
        <Card onClick={() => (window.location.href = "/post-job")} className="flex items-center justify-between">
          <div>
            <div className="font-bold text-pj-slate-900">Post a job</div>
            <div className="text-sm text-pj-slate-500">Describe it and compare bids</div>
          </div>
          <span className="text-pj-blue-600 text-2xl">→</span>
        </Card>
      </div>

      <h2 className="text-lg font-bold text-pj-slate-900 mb-3">Your bookings</h2>
      {bookings.length === 0 ? (
        <Empty>No bookings yet. <Link href="/browse" className="text-pj-blue-600 font-semibold">Find a provider →</Link></Empty>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {bookings.slice(0, 4).map((b) => (
            <Card key={b.id}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-pj-slate-900">{b.service}</div>
                  <div className="text-sm text-pj-slate-500">{b.counterparty_name}</div>
                </div>
                <Badge color={b.status === "completed" ? "green" : "blue"}>{b.status.replace(/_/g, " ")}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      <h2 className="text-lg font-bold text-pj-slate-900 mb-3">Top rated near you</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {providers.map((p) => (
          <Link key={p.id} href={`/providers/${p.id}`}>
            <Card className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-pj-slate-900">{p.full_name}</div>
                <div className="text-sm text-pj-slate-500">{p.headline?.split("·")[0] ?? p.primary_category} · ⭐ {p.rating}</div>
              </div>
              <div className="font-extrabold text-pj-slate-900">${p.hourly_rate}<span className="text-xs text-pj-slate-400">/hr</span></div>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}

/* ---------------- Provider ---------------- */
function ProviderHome() {
  const [data, setData] = useState<ProviderDashboard | null>(null);
  const [jobs, setJobs] = useState<OpenJob[]>([]);
  useEffect(() => {
    Promise.all([api.providerDashboard(), api.providerOpenJobs()]).then(([d, j]) => {
      setData(d);
      setJobs(j.jobs.slice(0, 5));
    });
  }, []);
  if (!data) return <Loading />;
  return (
    <>
      <PageHeader title="Provider dashboard" subtitle="Your jobs, bids and earnings at a glance." action={<Button href="/work">Find work</Button>} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Stat value={`$${data.week_earnings}`} label="This week" />
        <Stat value={data.active} label="Active jobs" />
        <Stat value={data.bids_out} label="Bids out" />
        <Stat value={data.profile?.rating ?? "—"} label="Rating" />
      </div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-pj-slate-900">New jobs nearby</h2>
        <Link href="/work" className="text-sm font-semibold text-pj-blue-600">See all</Link>
      </div>
      {jobs.length === 0 ? (
        <Empty>No open jobs right now.</Empty>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {jobs.map((j) => (
            <Link key={j.id} href="/work">
              <Card>
                <div className="flex justify-between">
                  {j.category && <Badge>{j.category}</Badge>}
                  <span className="font-extrabold text-pj-slate-900">${j.budget_min ?? "?"}–{j.budget_max ?? "?"}</span>
                </div>
                <div className="font-semibold text-pj-slate-900 mt-2">{j.title}</div>
                <div className="text-sm text-pj-slate-500">{[j.location, j.when_text].filter(Boolean).join(" · ")}</div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------------- Corporate ---------------- */
function CorporateHome({ name }: { name: string }) {
  const [data, setData] = useState<CorporateDashboard | null>(null);
  useEffect(() => {
    api.corporateDashboard().then(setData);
  }, []);
  if (!data) return <Loading />;
  return (
    <>
      <PageHeader title={`Welcome, ${name.split(" ")[0]}`} subtitle="Your hiring at a glance." action={<Button href="/hiring/new">New request</Button>} />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <Stat value={`$${data.month_spend}`} label="Spend this month" />
        <Stat value={data.active} label="Active requests" />
        <Stat value={data.this_month} label="Posted this month" />
      </div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-pj-slate-900">Recent requests</h2>
        <Link href="/hiring" className="text-sm font-semibold text-pj-blue-600">See all</Link>
      </div>
      {data.recent.length === 0 ? (
        <Empty>No requests yet. <Link href="/hiring/new" className="text-pj-blue-600 font-semibold">Post one →</Link></Empty>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {data.recent.map((r) => (
            <Card key={r.id}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-pj-slate-900">{r.role_skill}</div>
                  <div className="text-sm text-pj-slate-500">{r.headcount} staff{r.site ? ` · ${r.site}` : ""}</div>
                </div>
                <Badge>{r.status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------------- Admin ---------------- */
function AdminHome() {
  const [m, setM] = useState<AdminMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .adminMetrics()
      .then(setM)
      .catch((e: Error) => setError(e?.message || "Could not load metrics"));
  }, []);

  if (error) return <Empty>{error}</Empty>;
  if (!m) return <Loading />;

  const money = (n: number) => `$${compact(Math.round(n))}`;

  return (
    <>
      <PageHeader
        title="Admin overview"
        subtitle="Platform health at a glance — people, demand, fulfilment and money."
        action={<Button href="/admin">Open moderation</Button>}
      />

      {/* Headline */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatTile
          label="Total signups"
          value={compact(m.total_users)}
          sub={`+${m.new_users_today} today · +${m.new_users_7d} this week`}
          tone={m.new_users_today > 0 ? "good" : "default"}
        />
        <StatTile label="Active jobs" value={compact(m.active_jobs)} sub={`${m.total_jobs} posted all-time`} />
        <StatTile
          label="Jobs in progress"
          value={compact(m.active_bookings)}
          sub={`${m.completed_bookings} completed`}
        />
        <StatTile
          label="Cash volume"
          value={money(m.cash_volume)}
          sub="Completed jobs, paid in cash"
        />
      </div>

      {/* Money — jobs settle in cash off-platform, so revenue is top-ups + commission */}
      <h2 className="text-lg font-bold text-pj-slate-900 mb-3">Revenue</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatTile label="Top-up revenue" value={money(m.topup_revenue)} sub="Collected from providers" />
        <StatTile
          label="Commission earned"
          value={money(m.commission_earned)}
          sub="10% of jobs taken"
          tone={m.commission_earned > 0 ? "good" : "default"}
        />
        <StatTile label="Unspent credit" value={money(m.unspent_credit)} sub="Prepaid, not yet used" />
        <StatTile
          label="Top-ups pending"
          value={m.pending_topups}
          sub="Awaiting confirmation"
          tone={m.pending_topups ? "warn" : "default"}
        />
      </div>

      {/* Needs attention */}
      <h2 className="text-lg font-bold text-pj-slate-900 mb-3">Needs attention</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatTile
          label="Pending verifications"
          value={m.pending_verifications}
          sub={m.pending_verifications ? "Providers awaiting review" : "Queue clear"}
          tone={m.pending_verifications ? "warn" : "good"}
        />
        <StatTile
          label="Open disputes"
          value={m.open_disputes}
          sub={m.open_disputes ? "Need resolution" : "None open"}
          tone={m.open_disputes ? "warn" : "good"}
        />
        <StatTile
          label="Open jobs, no bids"
          value={m.open_jobs_without_bids}
          sub="Unmet demand"
          tone={m.open_jobs_without_bids ? "warn" : "good"}
        />
      </div>

      {/* Trends */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <div className="flex items-baseline justify-between mb-7">
            <h2 className="font-bold text-pj-slate-900">Signups</h2>
            <span className="text-xs text-pj-slate-500">Last 30 days · {m.new_users_30d} total</span>
          </div>
          <TrendChart data={m.signups_series} noun="signups" />
        </Card>
        <Card>
          <div className="flex items-baseline justify-between mb-7">
            <h2 className="font-bold text-pj-slate-900">Jobs posted</h2>
            <span className="text-xs text-pj-slate-500">Last 30 days · {m.jobs_7d} this week</span>
          </div>
          <TrendChart data={m.jobs_series} noun="jobs" />
        </Card>
      </div>

      {/* Breakdowns */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <h2 className="font-bold text-pj-slate-900 mb-4">Users by role</h2>
          <BarBreakdown
            items={[
              { label: "Customers", value: m.customers },
              { label: "Providers", value: m.providers },
              { label: "Corporates", value: m.corporates },
              { label: "Admins", value: m.admins },
            ]}
          />
        </Card>
        <Card>
          <h2 className="font-bold text-pj-slate-900 mb-4">Jobs by status</h2>
          <BarBreakdown
            items={[
              { label: "Open", value: m.active_jobs },
              { label: "Assigned", value: m.assigned_jobs },
              { label: "Completed", value: m.completed_jobs },
              { label: "Cancelled", value: m.cancelled_jobs },
            ]}
          />
        </Card>
        <Card>
          <h2 className="font-bold text-pj-slate-900 mb-4">Top job categories</h2>
          <BarBreakdown items={m.top_categories.map((c) => ({ label: c.category, value: c.count }))} />
        </Card>
      </div>

      {/* Marketplace health */}
      <h2 className="text-lg font-bold text-pj-slate-900 mb-3">Marketplace health</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatTile label="Total bids" value={compact(m.total_bids)} sub={`${m.avg_bids_per_job} avg per job`} />
        <StatTile
          label="Verified providers"
          value={`${m.verified_providers}/${m.providers}`}
          sub="ID-verified"
          tone={m.providers && m.verified_providers === 0 ? "warn" : "default"}
        />
        <StatTile
          label="Avg rating"
          value={m.total_reviews ? `${m.avg_rating.toFixed(1)}★` : "—"}
          sub={`${m.total_reviews} review${m.total_reviews === 1 ? "" : "s"}`}
        />
        <StatTile label="Bookings" value={compact(m.total_bookings)} sub={`${m.cancelled_bookings} cancelled`} />
      </div>

      {/* Recent signups */}
      <h2 className="text-lg font-bold text-pj-slate-900 mb-3">Recent signups</h2>
      {m.recent_users.length === 0 ? (
        <Empty>No signups yet.</Empty>
      ) : (
        <div className="rounded-2xl border border-pj-slate-200 bg-white overflow-hidden">
          <ul className="divide-y divide-pj-slate-100">
            {m.recent_users.map((u) => (
              <li key={u.id} className="flex items-center gap-3 p-4">
                <Avatar src={u.avatar_url} name={u.full_name} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-pj-slate-900 truncate">{u.full_name}</div>
                  <div className="text-sm text-pj-slate-500 truncate">{u.email ?? "—"}</div>
                </div>
                <Badge color={u.role === "provider" ? "green" : u.role === "admin" ? "amber" : "blue"}>
                  {u.role}
                </Badge>
                <div className="hidden sm:block w-20 text-right text-xs text-pj-slate-500 tabular-nums">
                  {new Date(u.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
