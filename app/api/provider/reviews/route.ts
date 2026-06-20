import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** GET /api/provider/reviews — reviews received by the signed-in provider. */
export const GET = safe(async (req: NextRequest) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "provider") return error("Providers only", 403);

  const summary = await sql`
    SELECT COUNT(*)::int AS total, COALESCE(ROUND(AVG(rating)::numeric,1),0) AS avg
    FROM reviews WHERE provider_id = ${auth.sub}
  `;
  const reviews = await sql`
    SELECT r.id, r.rating, r.comment, r.tags, r.photos, r.created_at, u.full_name AS reviewer_name
    FROM reviews r JOIN users u ON u.id = r.reviewer_id
    WHERE r.provider_id = ${auth.sub}
    ORDER BY r.created_at DESC LIMIT 50
  `;
  return json({ total: summary[0].total, average: summary[0].avg, reviews });
});
