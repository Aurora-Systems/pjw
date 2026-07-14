import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * GET /api/provider/jobs — open jobs the provider can bid on.
 * Excludes the provider's own jobs; flags jobs they've already bid on.
 * Optional ?category= filter.
 */
export const GET = safe(async (req: NextRequest) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "provider") return error("Providers only", 403);

  // Default the feed to the provider's own trade for relevance; ?all=true shows everything,
  // ?category= overrides explicitly.
  let category = req.nextUrl.searchParams.get("category");
  const showAll = req.nextUrl.searchParams.get("all") === "true";
  if (!category && !showAll) {
    const prof = await sql`SELECT primary_category FROM provider_profiles WHERE user_id = ${auth.sub}`;
    category = prof[0]?.primary_category ?? null;
  }

  const text = `
    SELECT j.id, j.title, j.category, j.description, j.budget_min, j.budget_max,
           j.when_text, j.location, j.created_at,
           j.workers_needed, j.hired_count,
           cu.full_name AS customer_name,
           cu.client_rating AS customer_rating,
           cu.client_reviews_count AS customer_reviews_count,
           COUNT(b.id)::int AS bid_count,
           BOOL_OR(b.provider_id = $1) AS has_my_bid,
           -- A multi-hire job stays 'open' after someone is hired, so a provider can still see a job
           -- they have already won. Tell them, instead of showing it as just another open job.
           COALESCE(BOOL_OR(b.provider_id = $1 AND b.status = 'accepted'), false) AS i_am_hired
    FROM jobs j
    JOIN users cu ON cu.id = j.customer_id
    LEFT JOIN bids b ON b.job_id = j.id
    WHERE j.status = 'open' AND j.customer_id <> $1
      AND ($2::text IS NULL OR j.category = $2)
    GROUP BY j.id, cu.full_name, cu.client_rating, cu.client_reviews_count
    ORDER BY j.created_at DESC
    LIMIT 50
  `;
  const jobs = await sql.query(text, [auth.sub, category]);
  return json({ jobs });
});
