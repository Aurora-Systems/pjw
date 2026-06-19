import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";
import { isOurUploadUrl } from "@/lib/r2";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * POST /api/reviews — leave a review after a job. Two-way:
 *  - a customer reviews the provider  (kind = 'provider')
 *  - a provider reviews the client    (kind = 'client')
 * The subject and direction are derived from the booking + the reviewer's role on it,
 * so you can only review the counterparty of a booking you were part of. A legacy
 * `provider_id` (review without a booking) is still accepted as a provider review.
 */
export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);

  let body: {
    provider_id?: string;
    booking_id?: string;
    rating?: number;
    comment?: string;
    tags?: string[];
    photos?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  if (!body.rating) return error("rating is required");
  if (body.rating < 1 || body.rating > 5) {
    return error("rating must be between 1 and 5");
  }

  // A review must be tied to a real booking you were part of, and only after it's done.
  // (No free-form provider_id path — that let anyone rate any provider with no booking.)
  if (!body.booking_id) return error("booking_id is required");
  const bk = await sql`SELECT customer_id, provider_id, status FROM bookings WHERE id = ${body.booking_id}`;
  if (bk.length === 0) return error("Booking not found", 404);
  const b = bk[0];

  let subjectId: string;
  let kind: "provider" | "client";
  if (auth.sub === b.customer_id) {
    subjectId = b.provider_id;
    kind = "provider";
  } else if (auth.sub === b.provider_id) {
    subjectId = b.customer_id;
    kind = "client";
  } else {
    return error("You can only review a booking you were part of", 403);
  }

  if (b.status !== "completed") {
    return error("You can leave a review once the job is completed.", 409);
  }

  // One review per person per booking — prevents rating manipulation by repeat submits.
  const dupe = await sql`
    SELECT 1 FROM reviews WHERE booking_id = ${body.booking_id} AND reviewer_id = ${auth.sub}
  `;
  if (dupe.length > 0) return error("You've already reviewed this job.", 409);

  const photos = Array.isArray(body.photos) ? body.photos.filter(isOurUploadUrl).slice(0, 6) : null;
  const providerId = kind === "provider" ? subjectId : null;

  const rows = await sql`
    INSERT INTO reviews (booking_id, reviewer_id, subject_id, kind, provider_id, rating, comment, tags, photos)
    VALUES (${body.booking_id ?? null}, ${auth.sub}, ${subjectId}, ${kind}, ${providerId}, ${body.rating},
            ${body.comment ?? null}, ${body.tags ?? null}, ${photos})
    RETURNING *
  `;

  if (kind === "provider") {
    // Recompute the provider's aggregate rating + review count.
    await sql`
      UPDATE provider_profiles pp SET rating = sub.avg_rating, reviews_count = sub.cnt
      FROM (
        SELECT subject_id, ROUND(AVG(rating)::numeric, 1) AS avg_rating, COUNT(*)::int AS cnt
        FROM reviews WHERE subject_id = ${subjectId} AND kind = 'provider' GROUP BY subject_id
      ) sub
      WHERE pp.user_id = sub.subject_id
    `;
  } else {
    // Recompute the client's aggregate rating + review count.
    await sql`
      UPDATE users u SET client_rating = sub.avg_rating, client_reviews_count = sub.cnt
      FROM (
        SELECT subject_id, ROUND(AVG(rating)::numeric, 1) AS avg_rating, COUNT(*)::int AS cnt
        FROM reviews WHERE subject_id = ${subjectId} AND kind = 'client' GROUP BY subject_id
      ) sub
      WHERE u.id = sub.subject_id
    `;
  }

  return json({ review: rows[0] }, { status: 201 });
}
