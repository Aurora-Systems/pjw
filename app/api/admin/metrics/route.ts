import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

const num = (v: unknown) => Number(v ?? 0);

/**
 * GET /api/admin/metrics — live platform metrics for the admin dashboard.
 *
 * The four original keys (active_users, jobs_today, open_disputes,
 * pending_verifications) are kept verbatim: the Ionic mobile app reads them.
 * Everything else is additive.
 *
 * Day boundaries are LOCAL (Africa/Harare, UTC+2). The Neon session runs in GMT, so a
 * bare `current_date` would push 00:00–02:00 local activity into the previous day.
 *
 * Soft-delete: `users`-derived counts exclude banned users (deleted_at IS NOT NULL), as
 * does provider credit. Job/booking/bid history is deliberately NOT filtered — those rows
 * are historical facts that still happened, even if the account was later banned.
 *
 * Money model (see lib/wallet.ts): jobs are CASH-ONLY and settle off-platform, so there is
 * no online job payment. The platform's money-in is provider wallet top-ups; a 10%
 * commission is then consumed from that prepaid balance per job. Hence:
 *   cash_volume       — value of completed bookings, paid in cash between the two parties
 *   topup_revenue     — money actually collected from providers
 *   commission_earned — top-up credit consumed as commission (net of refunds)
 *   unspent_credit    — prepaid credit not yet consumed (deferred, non-refundable)
 * There are no payouts, so nothing here is "owed to" providers.
 */
export const GET = safe(async (req: NextRequest) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "admin") return error("Admins only", 403);

  const [
    users,
    jobs,
    bookings,
    wallet,
    credit,
    topups,
    liquidity,
    reviews,
    disputes,
    verifications,
    signupsSeries,
    jobsSeries,
    topCategories,
    recentUsers,
  ] = await Promise.all([
    sql`
      WITH b AS (
        SELECT
          (date_trunc('day', now() AT TIME ZONE 'Africa/Harare') AT TIME ZONE 'Africa/Harare') AS t0,
          ((date_trunc('day', now() AT TIME ZONE 'Africa/Harare') - interval '6 days') AT TIME ZONE 'Africa/Harare') AS t7,
          ((date_trunc('day', now() AT TIME ZONE 'Africa/Harare') - interval '29 days') AT TIME ZONE 'Africa/Harare') AS t30
      )
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE u.created_at >= b.t0)::int  AS today,
        COUNT(*) FILTER (WHERE u.created_at >= b.t7)::int  AS d7,
        COUNT(*) FILTER (WHERE u.created_at >= b.t30)::int AS d30,
        COUNT(*) FILTER (WHERE u.role = 'customer')::int   AS customers,
        COUNT(*) FILTER (WHERE u.role = 'provider')::int   AS providers,
        COUNT(*) FILTER (WHERE u.role = 'corporate')::int  AS corporates,
        COUNT(*) FILTER (WHERE u.role = 'admin')::int      AS admins,
        COUNT(*) FILTER (WHERE u.role = 'provider' AND u.id_verified)::int AS verified_providers
      FROM users u CROSS JOIN b
      WHERE u.deleted_at IS NULL
    `,
    sql`
      WITH b AS (
        SELECT
          (date_trunc('day', now() AT TIME ZONE 'Africa/Harare') AT TIME ZONE 'Africa/Harare') AS t0,
          ((date_trunc('day', now() AT TIME ZONE 'Africa/Harare') - interval '6 days') AT TIME ZONE 'Africa/Harare') AS t7
      )
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE j.status = 'open')::int      AS open,
        COUNT(*) FILTER (WHERE j.status = 'assigned')::int  AS assigned,
        COUNT(*) FILTER (WHERE j.status = 'completed')::int AS completed,
        COUNT(*) FILTER (WHERE j.status = 'cancelled')::int AS cancelled,
        COUNT(*) FILTER (WHERE j.created_at >= b.t0)::int   AS today,
        COUNT(*) FILTER (WHERE j.created_at >= b.t7)::int   AS d7
      FROM jobs j CROSS JOIN b
    `,
    sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status IN ('confirmed','on_the_way','arrived','in_progress'))::int AS active,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
        COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled,
        COALESCE(SUM(total) FILTER (WHERE status = 'completed'), 0)::float AS cash_volume
      FROM bookings
    `,
    // The wallet ledger is the source of truth for money. Commission rows are stored as
    // negative deductions, so negate the sum; refunds net against it.
    sql`
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE type = 'topup'), 0)::float AS topup_revenue,
        COALESCE(-SUM(amount) FILTER (WHERE type IN ('commission','commission_refund')), 0)::float AS commission_earned
      FROM wallet_transactions
    `,
    // Unspent prepaid credit held by live providers. Balances may go negative (lib/wallet.ts),
    // so clamp: a negative balance is not "credit".
    sql`
      SELECT COALESCE(SUM(GREATEST(pp.balance, 0)), 0)::float AS unspent_credit
      FROM provider_profiles pp
      JOIN users u ON u.id = pp.user_id
      WHERE u.deleted_at IS NULL
    `,
    sql`SELECT COUNT(*) FILTER (WHERE status = 'pending')::int AS pending FROM payments`,
    sql`
      SELECT
        (SELECT COUNT(*) FROM bids)::int AS total_bids,
        (SELECT COUNT(*) FROM jobs j
          WHERE j.status = 'open'
            AND NOT EXISTS (SELECT 1 FROM bids b WHERE b.job_id = j.id))::int AS open_jobs_without_bids
    `,
    sql`
      SELECT
        COUNT(*)::int AS total,
        COALESCE(ROUND(AVG(rating)::numeric, 2), 0)::float AS avg_rating
      FROM reviews
    `,
    sql`SELECT COUNT(*) FILTER (WHERE status = 'open')::int AS open FROM disputes`,
    // Mirrors GET /api/admin/verifications exactly, so the tile always equals the queue length.
    // 'rejected' providers are excluded — otherwise a rejected provider is stuck in the queue
    // forever (reject only sets verification_status, never id_verified). Resubmitting sets the
    // status back to 'pending' (app/api/verification/start), which re-enters them here.
    sql`
      SELECT COUNT(*)::int AS n
      FROM users u
      JOIN provider_profiles pp ON pp.user_id = u.id
      WHERE u.role = 'provider'
        AND u.id_verified = false
        AND u.verification_status IN ('unverified','pending')
        AND u.deleted_at IS NULL
    `,
    sql`
      WITH days AS (
        SELECT generate_series(
          (date_trunc('day', now() AT TIME ZONE 'Africa/Harare') - interval '29 days')::date,
          (date_trunc('day', now() AT TIME ZONE 'Africa/Harare'))::date,
          interval '1 day'
        )::date AS day
      )
      SELECT to_char(d.day, 'YYYY-MM-DD') AS date, COALESCE(c.n, 0)::int AS count
      FROM days d
      LEFT JOIN (
        SELECT (created_at AT TIME ZONE 'Africa/Harare')::date AS day, COUNT(*) AS n
        FROM users
        WHERE deleted_at IS NULL
          AND created_at >= ((date_trunc('day', now() AT TIME ZONE 'Africa/Harare') - interval '29 days') AT TIME ZONE 'Africa/Harare')
        GROUP BY 1
      ) c ON c.day = d.day
      ORDER BY d.day
    `,
    sql`
      WITH days AS (
        SELECT generate_series(
          (date_trunc('day', now() AT TIME ZONE 'Africa/Harare') - interval '29 days')::date,
          (date_trunc('day', now() AT TIME ZONE 'Africa/Harare'))::date,
          interval '1 day'
        )::date AS day
      )
      SELECT to_char(d.day, 'YYYY-MM-DD') AS date, COALESCE(c.n, 0)::int AS count
      FROM days d
      LEFT JOIN (
        SELECT (created_at AT TIME ZONE 'Africa/Harare')::date AS day, COUNT(*) AS n
        FROM jobs
        WHERE created_at >= ((date_trunc('day', now() AT TIME ZONE 'Africa/Harare') - interval '29 days') AT TIME ZONE 'Africa/Harare')
        GROUP BY 1
      ) c ON c.day = d.day
      ORDER BY d.day
    `,
    sql`
      SELECT COALESCE(NULLIF(category, ''), 'Uncategorised') AS category, COUNT(*)::int AS count
      FROM jobs
      GROUP BY 1
      ORDER BY count DESC, category ASC
      LIMIT 6
    `,
    sql`
      SELECT id, full_name, email, role, avatar_url, created_at
      FROM users
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 8
    `,
  ]);

  const u = users[0];
  const j = jobs[0];
  const b = bookings[0];
  const totalJobs = num(j.total);
  const totalBids = num(liquidity[0].total_bids);

  return json({
    // ── Legacy keys — the mobile app reads these. Do not rename. ──
    active_users: num(u.total),
    jobs_today: num(j.today),
    open_disputes: num(disputes[0].open),
    pending_verifications: num(verifications[0].n),

    // ── People ──
    total_users: num(u.total),
    new_users_today: num(u.today),
    new_users_7d: num(u.d7),
    new_users_30d: num(u.d30),
    customers: num(u.customers),
    providers: num(u.providers),
    corporates: num(u.corporates),
    admins: num(u.admins),
    verified_providers: num(u.verified_providers),

    // ── Demand (jobs) ──
    total_jobs: totalJobs,
    active_jobs: num(j.open),
    assigned_jobs: num(j.assigned),
    completed_jobs: num(j.completed),
    cancelled_jobs: num(j.cancelled),
    jobs_7d: num(j.d7),

    // ── Fulfilment (bookings) ──
    total_bookings: num(b.total),
    active_bookings: num(b.active),
    completed_bookings: num(b.completed),
    cancelled_bookings: num(b.cancelled),

    // ── Money (see the docstring — jobs are cash-only; there are no payouts) ──
    cash_volume: num(b.cash_volume),
    topup_revenue: num(wallet[0].topup_revenue),
    commission_earned: num(wallet[0].commission_earned),
    unspent_credit: num(credit[0].unspent_credit),
    pending_topups: num(topups[0].pending),

    // ── Marketplace liquidity ──
    total_bids: totalBids,
    avg_bids_per_job: totalJobs ? Math.round((totalBids / totalJobs) * 10) / 10 : 0,
    open_jobs_without_bids: num(liquidity[0].open_jobs_without_bids),

    // ── Quality ──
    total_reviews: num(reviews[0].total),
    avg_rating: num(reviews[0].avg_rating),

    // ── Series & breakdowns ──
    signups_series: signupsSeries.map((r) => ({ date: String(r.date), count: num(r.count) })),
    jobs_series: jobsSeries.map((r) => ({ date: String(r.date), count: num(r.count) })),
    top_categories: topCategories.map((r) => ({ category: String(r.category), count: num(r.count) })),
    recent_users: recentUsers.map((r) => ({
      id: String(r.id),
      full_name: String(r.full_name ?? ""),
      email: r.email ? String(r.email) : null,
      role: String(r.role),
      avatar_url: r.avatar_url ? String(r.avatar_url) : null,
      created_at: String(r.created_at),
    })),
  });
});
