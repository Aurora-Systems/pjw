import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

const STATUSES = [
  "confirmed",
  "on_the_way",
  "arrived",
  "in_progress",
  "completed",
  "cancelled",
];

/** GET /api/bookings/:id — single booking incl. live provider location (tracking). */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  const { id } = await params;

  const rows = await sql`
    SELECT b.*, cu.full_name AS customer_name, pr.full_name AS provider_name,
           pp.lat AS provider_base_lat, pp.lng AS provider_base_lng,
           cu.client_rating AS customer_rating, cu.client_reviews_count AS customer_reviews_count,
           pp.rating AS provider_rating, pp.reviews_count AS provider_reviews_count
    FROM bookings b
    JOIN users cu ON cu.id = b.customer_id
    JOIN users pr ON pr.id = b.provider_id
    LEFT JOIN provider_profiles pp ON pp.user_id = b.provider_id
    WHERE b.id = ${id} AND (b.customer_id = ${auth.sub} OR b.provider_id = ${auth.sub})
  `;
  if (rows.length === 0) return error("Booking not found", 404);
  return json({ booking: rows[0] });
}

/** PATCH /api/bookings/:id — update booking status (tracking / completion). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);

  const { id } = await params;
  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  if (!body.status || !STATUSES.includes(body.status)) {
    return error("Valid status is required");
  }

  const rows = await sql`
    SELECT * FROM bookings WHERE id = ${id} AND (customer_id = ${auth.sub} OR provider_id = ${auth.sub})
  `;
  if (rows.length === 0) return error("Booking not found", 404);

  const updated = await sql`
    UPDATE bookings SET status = ${body.status} WHERE id = ${id} RETURNING *
  `;
  return json({ booking: updated[0] });
}
