import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { json, error, preflight, safe } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

export const GET = safe(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  // All four reads are independent — run them concurrently, then 404 if the provider is missing.
  const [rows, services, reviews, portfolio] = await Promise.all([
    sql`
      SELECT u.id, u.full_name, u.avatar_url, u.phone_verified, u.city,
             (u.didit_status ILIKE 'approved') AS didit_verified,
             -- Public trust signal only — the Didit truth, under the name the mobile app reads.
             -- Never expose the raw users.id_verified work gate here (an admin can grant it).
             (u.didit_status ILIKE 'approved') AS id_verified,
             pp.headline, pp.bio, pp.primary_category, pp.years_experience, pp.hourly_rate,
             pp.visit_fee, pp.min_hours, pp.rating, pp.jobs_count, pp.on_time_pct,
             pp.reviews_count, pp.available, pp.is_pro, pp.is_top_rated,
             pp.background_checked, pp.license_verified, pp.joined_at,
             round(pp.lat::numeric, 2) AS lat, round(pp.lng::numeric, 2) AS lng
      FROM users u
      JOIN provider_profiles pp ON pp.user_id = u.id
      WHERE u.id = ${id} AND u.role = 'provider' AND u.deleted_at IS NULL
    `,
    sql`
      SELECT id, category, title, rate, rate_type
      FROM provider_services WHERE provider_id = ${id}
    `,
    sql`
      SELECT r.id, r.rating, r.comment, r.tags, r.photos, r.created_at, r.provider_response, r.responded_at,
             u.full_name AS reviewer_name
      FROM reviews r JOIN users u ON u.id = r.reviewer_id
      WHERE r.provider_id = ${id} AND r.flagged = false
      ORDER BY r.created_at DESC LIMIT 20
    `,
    sql`
      SELECT url
      FROM provider_portfolio WHERE provider_id = ${id}
      ORDER BY created_at DESC LIMIT 12
    `,
  ]);
  if (rows.length === 0) return error("Provider not found", 404);

  return json({ provider: rows[0], services, reviews, portfolio: portfolio.map((p) => p.url) });
});
