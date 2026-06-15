import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { json, error, preflight } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const rows = await sql`
    SELECT u.id, u.full_name, u.avatar_url, u.id_verified, u.phone_verified, u.city,
           pp.headline, pp.bio, pp.primary_category, pp.years_experience, pp.hourly_rate,
           pp.visit_fee, pp.min_hours, pp.rating, pp.jobs_count, pp.on_time_pct,
           pp.reviews_count, pp.available, pp.is_pro, pp.is_top_rated,
           pp.background_checked, pp.license_verified, pp.joined_at, pp.lat, pp.lng
    FROM users u
    JOIN provider_profiles pp ON pp.user_id = u.id
    WHERE u.id = ${id} AND u.role = 'provider'
  `;
  if (rows.length === 0) return error("Provider not found", 404);

  const services = await sql`
    SELECT id, category, title, rate, rate_type
    FROM provider_services WHERE provider_id = ${id}
  `;
  const reviews = await sql`
    SELECT r.id, r.rating, r.comment, r.tags, r.photos, r.created_at, u.full_name AS reviewer_name
    FROM reviews r JOIN users u ON u.id = r.reviewer_id
    WHERE r.provider_id = ${id}
    ORDER BY r.created_at DESC LIMIT 20
  `;
  const portfolio = await sql`
    SELECT url
    FROM provider_portfolio WHERE provider_id = ${id}
    ORDER BY created_at DESC LIMIT 12
  `;

  return json({ provider: rows[0], services, reviews, portfolio: portfolio.map((p) => p.url) });
}
