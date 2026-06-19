import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { json, preflight } from "@/lib/http";

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
 */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const category = p.get("category");
  const q = p.get("q");
  const verified = p.get("verified") === "true";
  const maxRate = p.get("maxRate") ? Number(p.get("maxRate")) : null;
  const sort = p.get("sort") || "distance";

  // ORDER BY can't be parameterized; whitelist instead.
  const orderBy =
    sort === "rating"
      ? "pp.rating DESC"
      : sort === "price"
        ? "pp.hourly_rate ASC"
        : "pp.distance_km ASC NULLS LAST";

  const text = `
    SELECT u.id, u.full_name, u.avatar_url, u.id_verified, u.city,
           pp.headline, pp.primary_category, pp.years_experience, pp.hourly_rate,
           pp.rating, pp.jobs_count, pp.reviews_count, pp.distance_km,
           pp.available, pp.is_pro, pp.is_top_rated,
           round(pp.lat::numeric, 2) AS lat, round(pp.lng::numeric, 2) AS lng
    FROM users u
    JOIN provider_profiles pp ON pp.user_id = u.id
    WHERE u.role = 'provider'
      AND pp.onboarded = true
      AND ($1::text IS NULL OR pp.primary_category = $1)
      AND ($2::text IS NULL OR u.full_name ILIKE '%' || $2 || '%' OR pp.headline ILIKE '%' || $2 || '%')
      AND ($3::boolean = false OR u.id_verified = true)
      AND ($4::numeric IS NULL OR pp.hourly_rate <= $4)
    ORDER BY ${orderBy}
    LIMIT 50
  `;
  const providers = await sql.query(text, [category, q, verified, maxRate]);
  return json({ providers });
}
