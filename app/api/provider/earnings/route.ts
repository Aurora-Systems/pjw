import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** GET /api/provider/earnings — payouts summary + recent completed jobs. */
export const GET = safe(async (req: NextRequest) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "provider") return error("Providers only", 403);

  const totals = await sql`
    SELECT
      COALESCE(SUM(total),0)::numeric AS all_time,
      COALESCE(SUM(total) FILTER (WHERE created_at >= date_trunc('month', now())),0)::numeric AS this_month,
      COUNT(*) FILTER (WHERE created_at >= date_trunc('month', now()))::int AS month_jobs
    FROM bookings
    WHERE provider_id = ${auth.sub} AND status = 'completed'
  `;
  // "Available to withdraw": completed earnings not yet older than payout cycle (demo: all completed).
  const available = await sql`
    SELECT COALESCE(SUM(total),0)::numeric AS amount FROM bookings
    WHERE provider_id = ${auth.sub} AND status = 'completed'
  `;
  const recent = await sql`
    SELECT b.id, b.service, b.total, b.created_at, cu.full_name AS customer_name
    FROM bookings b JOIN users cu ON cu.id = b.customer_id
    WHERE b.provider_id = ${auth.sub} AND b.status = 'completed'
    ORDER BY b.created_at DESC LIMIT 20
  `;

  return json({
    available: available[0].amount,
    all_time: totals[0].all_time,
    this_month: totals[0].this_month,
    month_jobs: totals[0].month_jobs,
    recent,
  });
});
