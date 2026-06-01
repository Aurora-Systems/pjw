import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** POST /api/reviews — leave a review for a provider after a job. */
export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);

  let body: {
    provider_id?: string;
    booking_id?: string;
    rating?: number;
    comment?: string;
    tags?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  if (!body.provider_id || !body.rating) {
    return error("provider_id and rating are required");
  }
  if (body.rating < 1 || body.rating > 5) {
    return error("rating must be between 1 and 5");
  }

  const rows = await sql`
    INSERT INTO reviews (booking_id, reviewer_id, provider_id, rating, comment, tags)
    VALUES (${body.booking_id ?? null}, ${auth.sub}, ${body.provider_id}, ${body.rating},
            ${body.comment ?? null}, ${body.tags ?? null})
    RETURNING *
  `;

  // Recompute the provider's aggregate rating + review count.
  await sql`
    UPDATE provider_profiles pp SET
      rating = sub.avg_rating,
      reviews_count = sub.cnt
    FROM (
      SELECT provider_id, ROUND(AVG(rating)::numeric, 1) AS avg_rating, COUNT(*)::int AS cnt
      FROM reviews WHERE provider_id = ${body.provider_id} GROUP BY provider_id
    ) sub
    WHERE pp.user_id = sub.provider_id
  `;

  return json({ review: rows[0] }, { status: 201 });
}
