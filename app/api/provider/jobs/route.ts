import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * GET /api/provider/jobs — open jobs the provider can offer on.
 * Excludes the provider's own jobs; flags jobs they've already made an offer on.
 * Query: ?category= (trade slug), ?mine=true (only the provider's own trade), ?q= (search).
 *
 * The feed deliberately defaults to EVERY trade. Narrowing it to the provider's own trade meant a
 * provider in a quiet trade opened the app to an empty screen and assumed the marketplace was dead;
 * showing everything (with ?mine=true available as an opt-in filter) keeps the feed alive. This is
 * a server-side default on purpose — it fixes already-released app builds that send no filter.
 * ?all=true is still accepted from older clients and is now simply the default behaviour.
 */
export const GET = safe(async (req: NextRequest) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "provider") return error("Providers only", 403);

  let category = req.nextUrl.searchParams.get("category");
  const mineOnly = req.nextUrl.searchParams.get("mine") === "true";
  if (!category && mineOnly) {
    const prof = await sql`SELECT primary_category FROM provider_profiles WHERE user_id = ${auth.sub}`;
    category = prof[0]?.primary_category ?? null;
  }
  // Free-text search across the job title, description and trade. Empty string means "no filter".
  const q = req.nextUrl.searchParams.get("q")?.trim() || null;

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
      AND ($3::text IS NULL OR j.title ILIKE '%' || $3 || '%'
                            OR j.description ILIKE '%' || $3 || '%'
                            OR j.category ILIKE '%' || $3 || '%')
    GROUP BY j.id, cu.full_name, cu.client_rating, cu.client_reviews_count
    ORDER BY j.created_at DESC
    LIMIT 50
  `;
  const jobs = await sql.query(text, [auth.sub, category, q]);
  return json({ jobs });
});
