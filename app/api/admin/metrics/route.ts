import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

const num = (v: unknown) => Number(v ?? 0);
/** Whole-number percentage, guarding the empty-platform case where the divisor is 0. */
const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);

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
    health,
    funnel,
    attention,
    growth,
    supplyDemand,
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

    // ── Marketplace health ──────────────────────────────────────────────
    // Does a posted job actually turn into work? Counts alone hide this: a healthy-looking
    // job total means nothing if most posts never receive an offer. Medians (not averages)
    // because a single stale job would drag a mean into uselessness.
    sql`
      WITH j AS (
        SELECT j.id, j.status, j.created_at,
               (SELECT COUNT(*) FROM bids b WHERE b.job_id = j.id) AS offers,
               (SELECT MIN(b.created_at) FROM bids b WHERE b.job_id = j.id) AS first_offer_at,
               (SELECT MIN(bk.created_at) FROM bookings bk WHERE bk.job_id = j.id) AS first_hire_at
        FROM jobs j
      )
      SELECT
        COUNT(*)::int                                                        AS jobs_total,
        COUNT(*) FILTER (WHERE offers = 0)::int                              AS jobs_no_offers,
        COUNT(*) FILTER (WHERE offers > 0)::int                              AS jobs_with_offers,
        COUNT(*) FILTER (WHERE first_hire_at IS NOT NULL)::int               AS jobs_filled,
        COALESCE(EXTRACT(epoch FROM percentile_cont(0.5) WITHIN GROUP (
          ORDER BY first_offer_at - created_at)) / 60.0, 0)::float           AS median_mins_to_first_offer,
        COALESCE(EXTRACT(epoch FROM percentile_cont(0.5) WITHIN GROUP (
          ORDER BY first_hire_at - created_at)) / 60.0, 0)::float            AS median_mins_to_hire
      FROM j
    `,

    // ── Provider activation funnel ──────────────────────────────────────
    // Signing up is not the same as being able to work. A provider must finish onboarding,
    // be permitted to work, AND hold wallet credit before they can make a single offer, so
    // the drop-off between these stages is where supply is actually lost.
    sql`
      SELECT
        COUNT(*)::int                                            AS signed_up,
        COUNT(*) FILTER (WHERE pp.onboarded)::int                AS onboarded,
        COUNT(*) FILTER (WHERE u.id_verified)::int               AS permitted,
        COUNT(*) FILTER (WHERE pp.balance > 0)::int              AS funded,
        (SELECT COUNT(DISTINCT provider_id) FROM bids)::int      AS made_offer,
        (SELECT COUNT(DISTINCT provider_id) FROM bookings)::int  AS worked
      FROM provider_profiles pp
      JOIN users u ON u.id = pp.user_id
      WHERE u.deleted_at IS NULL
    `,

    // ── Needs attention now ─────────────────────────────────────────────
    // The operational queue: things silently rotting that a manager should chase today.
    sql`
      SELECT
        (SELECT COUNT(*) FROM jobs
          WHERE status = 'open'
            AND created_at < now() - interval '48 hours'
            AND NOT EXISTS (SELECT 1 FROM bids b WHERE b.job_id = jobs.id))::int AS stale_jobs_no_offers,
        -- Completed work the provider has not confirmed being paid for. Only they can
        -- confirm (cash settles off-platform), so these can sit unnoticed forever.
        (SELECT COUNT(*) FROM bookings
          WHERE status = 'completed' AND payment_status IS DISTINCT FROM 'paid')::int AS completed_unpaid,
        (SELECT COUNT(*) FROM bookings
          WHERE status NOT IN ('completed','cancelled'))::int                    AS bookings_in_flight,
        (SELECT COUNT(*) FROM jobs
          WHERE status = 'open' AND COALESCE(NULLIF(category, ''), NULL) IS NULL)::int AS jobs_missing_category,
        -- Age of the oldest thing waiting on a human, in hours.
        COALESCE((SELECT EXTRACT(epoch FROM now() - MIN(created_at)) / 3600.0
                  FROM disputes WHERE status = 'open'), 0)::float               AS oldest_open_dispute_hrs
    `,

    // ── Growth: this 7 days vs the 7 before ─────────────────────────────
    // A raw total can't tell you whether things are speeding up or falling off a cliff.
    sql`
      SELECT
        (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL
           AND created_at >= now() - interval '7 days')::int                     AS signups_7d,
        (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL
           AND created_at >= now() - interval '14 days'
           AND created_at <  now() - interval '7 days')::int                     AS signups_prev_7d,
        (SELECT COUNT(*) FROM jobs
           WHERE created_at >= now() - interval '7 days')::int                   AS jobs_7d,
        (SELECT COUNT(*) FROM jobs
           WHERE created_at >= now() - interval '14 days'
             AND created_at <  now() - interval '7 days')::int                   AS jobs_prev_7d,
        (SELECT COALESCE(SUM(total), 0) FROM bookings
           WHERE status = 'completed' AND created_at >= now() - interval '7 days')::float   AS gmv_7d,
        (SELECT COALESCE(SUM(total), 0) FROM bookings
           WHERE status = 'completed' AND created_at >= now() - interval '14 days'
             AND created_at <  now() - interval '7 days')::float                 AS gmv_prev_7d,
        -- Demand that comes back is the strongest signal the product works.
        (SELECT COUNT(*) FROM (
           SELECT customer_id FROM jobs GROUP BY customer_id HAVING COUNT(*) > 1) x)::int   AS repeat_customers,
        (SELECT COUNT(DISTINCT customer_id) FROM jobs)::int                      AS customers_who_posted
    `,

    // ── Supply vs demand, per trade ─────────────────────────────────────
    // Ordered by unanswered demand: the top row is where to recruit next. `can_take_work`
    // is the honest supply number — a provider with no wallet credit cannot make an offer.
    sql`
      WITH demand AS (
        SELECT COALESCE(NULLIF(category, ''), 'Uncategorised') AS trade,
               COUNT(*)::int AS jobs,
               COUNT(*) FILTER (
                 WHERE NOT EXISTS (SELECT 1 FROM bids b WHERE b.job_id = j.id))::int AS unanswered
        FROM jobs j GROUP BY 1
      ),
      supply AS (
        SELECT COALESCE(NULLIF(pp.primary_category, ''), 'Uncategorised') AS trade,
               COUNT(*)::int AS providers,
               COUNT(*) FILTER (WHERE pp.balance > 0)::int AS can_take_work
        FROM provider_profiles pp
        JOIN users u ON u.id = pp.user_id
        WHERE u.deleted_at IS NULL
        GROUP BY 1
      )
      SELECT d.trade,
             d.jobs, d.unanswered,
             COALESCE(s.providers, 0)::int      AS providers,
             COALESCE(s.can_take_work, 0)::int  AS can_take_work
      FROM demand d
      LEFT JOIN supply s ON s.trade = d.trade
      ORDER BY d.unanswered DESC, d.jobs DESC
      LIMIT 8
    `,
  ]);

  const u = users[0];
  const j = jobs[0];
  const b = bookings[0];
  const h = health[0];
  const f = funnel[0];
  const a = attention[0];
  const g = growth[0];
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

    // ── Marketplace health ──
    // pct_* are shares of all jobs ever posted; the medians are in minutes.
    fill_rate_pct: pct(num(h.jobs_filled), num(h.jobs_total)),
    offer_rate_pct: pct(num(h.jobs_with_offers), num(h.jobs_total)),
    jobs_no_offers: num(h.jobs_no_offers),
    median_mins_to_first_offer: Math.round(num(h.median_mins_to_first_offer)),
    median_mins_to_hire: Math.round(num(h.median_mins_to_hire)),

    // ── Provider activation funnel (each stage is a subset of the one before) ──
    funnel: {
      signed_up: num(f.signed_up),
      onboarded: num(f.onboarded),
      permitted: num(f.permitted),
      funded: num(f.funded),
      made_offer: num(f.made_offer),
      worked: num(f.worked),
    },

    // ── Needs attention now ──
    stale_jobs_no_offers: num(a.stale_jobs_no_offers),
    completed_unpaid: num(a.completed_unpaid),
    bookings_in_flight: num(a.bookings_in_flight),
    jobs_missing_category: num(a.jobs_missing_category),
    oldest_open_dispute_hrs: Math.round(num(a.oldest_open_dispute_hrs)),

    // ── Growth: last 7 days vs the 7 before ──
    growth: {
      signups: { now: num(g.signups_7d), prev: num(g.signups_prev_7d) },
      jobs: { now: num(g.jobs_7d), prev: num(g.jobs_prev_7d) },
      gmv: { now: num(g.gmv_7d), prev: num(g.gmv_prev_7d) },
    },
    repeat_customers: num(g.repeat_customers),
    customers_who_posted: num(g.customers_who_posted),
    repeat_rate_pct: pct(num(g.repeat_customers), num(g.customers_who_posted)),

    // ── Supply vs demand per trade ──
    supply_demand: supplyDemand.map((r) => ({
      trade: String(r.trade),
      jobs: num(r.jobs),
      unanswered: num(r.unanswered),
      providers: num(r.providers),
      can_take_work: num(r.can_take_work),
    })),

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
