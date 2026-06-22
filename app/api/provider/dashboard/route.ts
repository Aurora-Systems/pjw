import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** GET /api/provider/dashboard — headline stats for the provider home screen. */
export const GET = safe(async (req: NextRequest) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "provider") return error("Providers only", 403);

  // Run the independent stat queries concurrently (single Neon round-trip each, in parallel).
  const [profile, active, bidsOut, week] = await Promise.all([
    sql`
      SELECT rating, jobs_count, available, is_pro, is_top_rated
      FROM provider_profiles WHERE user_id = ${auth.sub}
    `,
    sql`
      SELECT COUNT(*)::int AS n FROM bookings
      WHERE provider_id = ${auth.sub} AND status NOT IN ('completed','cancelled')
    `,
    sql`
      SELECT COUNT(*)::int AS n FROM bids WHERE provider_id = ${auth.sub} AND status = 'pending'
    `,
    sql`
      SELECT COALESCE(SUM(total),0)::numeric AS amount, COUNT(*)::int AS jobs
      FROM bookings
      WHERE provider_id = ${auth.sub} AND status = 'completed'
        AND created_at >= now() - interval '7 days'
    `,
  ]);

  return json({
    profile: profile[0] ?? null,
    active: active[0].n,
    bids_out: bidsOut[0].n,
    week_earnings: week[0].amount,
    week_jobs: week[0].jobs,
  });
});
