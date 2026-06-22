import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { json, preflight, safe } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * GET /api/providers
 * Query params:
 *   category  — filter by primary category slug
 *   q         — text search over name / headline
 *   verified  — "true" to only return id-verified providers
 *   maxRate   — only providers at/under this hourly rate
 *   sort       — "distance" (default) | "rating" | "price"
 *   lat,lng    — the searcher's location; when present, distance_km is computed live
 * Active boosts (boost_until in the future) always rank first.
 */
export const GET = safe(async (req: NextRequest) => {
  const p = req.nextUrl.searchParams;
  const category = p.get("category");
  const q = p.get("q");
  const verified = p.get("verified") === "true";
  const maxRate = p.get("maxRate") ? Number(p.get("maxRate")) : null;
  const lat = p.get("lat") ? Number(p.get("lat")) : null;
  const lng = p.get("lng") ? Number(p.get("lng")) : null;
  const sort = p.get("sort") || "distance";

  // ORDER BY can't be parameterized; whitelist instead. Distance refers to the computed alias.
  const orderBy =
    sort === "rating"
      ? "pp.rating DESC NULLS LAST"
      : sort === "price"
        ? "pp.hourly_rate ASC NULLS LAST"
        : "distance_km ASC NULLS LAST";

  // Great-circle distance from the searcher (km), clamped to keep acos in domain.
  const distanceExpr = `
    CASE WHEN $5::numeric IS NOT NULL AND pp.lat IS NOT NULL AND pp.lng IS NOT NULL THEN
      round((6371 * acos(LEAST(1, GREATEST(-1,
        cos(radians($5)) * cos(radians(pp.lat)) * cos(radians(pp.lng) - radians($6))
        + sin(radians($5)) * sin(radians(pp.lat))
      ))))::numeric, 1)
    ELSE pp.distance_km END AS distance_km`;

  const text = `
    SELECT u.id, u.full_name, u.avatar_url, u.id_verified, u.city,
           pp.headline, pp.primary_category, pp.years_experience, pp.hourly_rate,
           pp.rating, pp.jobs_count, pp.reviews_count,
           pp.available, pp.is_pro, pp.is_top_rated,
           (pp.boost_until IS NOT NULL AND pp.boost_until > now()) AS boosted,
           round(pp.lat::numeric, 2) AS lat, round(pp.lng::numeric, 2) AS lng,
           ${distanceExpr}
    FROM users u
    JOIN provider_profiles pp ON pp.user_id = u.id
    WHERE u.role = 'provider'
      AND pp.onboarded = true
      AND ($1::text IS NULL OR pp.primary_category = $1)
      AND ($2::text IS NULL OR u.full_name ILIKE '%' || $2 || '%' OR pp.headline ILIKE '%' || $2 || '%')
      AND ($3::boolean = false OR u.id_verified = true)
      AND ($4::numeric IS NULL OR pp.hourly_rate <= $4)
    ORDER BY COALESCE(pp.boost_until > now(), false) DESC, ${orderBy}
    LIMIT 50
  `;
  const providers = await sql.query(text, [category, q, verified, maxRate, lat, lng]);
  return json({ providers });
});
