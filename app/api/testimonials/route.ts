import { sql } from "@/lib/db";
import { json, preflight, safe } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * GET /api/testimonials — public. Recent real 5-star reviews for the marketing site.
 * Returns reviewer first name + provider name; empty array if there are none yet
 * (the landing then shows an honest non-testimonial fallback).
 */
export const GET = safe(async () => {
  const testimonials = await sql`
    SELECT r.comment, r.rating, r.created_at,
           split_part(cu.full_name, ' ', 1) AS reviewer_first_name,
           pr.full_name AS provider_name,
           pp.primary_category
    FROM reviews r
    JOIN users cu ON cu.id = r.reviewer_id
    JOIN users pr ON pr.id = r.provider_id
    LEFT JOIN provider_profiles pp ON pp.user_id = r.provider_id
    WHERE r.rating = 5 AND r.comment IS NOT NULL AND length(trim(r.comment)) > 0
    ORDER BY r.created_at DESC
    LIMIT 6
  `;
  return json({ testimonials });
});
