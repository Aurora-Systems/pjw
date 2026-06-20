import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** GET /api/corporate/dashboard — operations overview for a corporate account. */
export const GET = safe(async (req: NextRequest) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "corporate") return error("Corporate accounts only", 403);

  const requests = await sql`
    SELECT
      COUNT(*) FILTER (WHERE status IN ('open','filling'))::int AS active,
      COUNT(*) FILTER (WHERE created_at >= date_trunc('month', now()))::int AS this_month,
      COALESCE(SUM(estimated_cost) FILTER (WHERE created_at >= date_trunc('month', now())),0)::numeric AS month_spend
    FROM workforce_requests WHERE corporate_id = ${auth.sub}
  `;
  const recent = await sql`
    SELECT id, role_skill, headcount, site, status, estimated_cost, created_at
    FROM workforce_requests WHERE corporate_id = ${auth.sub}
    ORDER BY created_at DESC LIMIT 10
  `;
  return json({
    active: requests[0].active,
    this_month: requests[0].this_month,
    month_spend: requests[0].month_spend,
    recent,
  });
});
