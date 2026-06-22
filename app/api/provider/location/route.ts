import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * POST /api/provider/location — a provider pushes their current GPS position.
 * Always updates their base location; if booking_id is given (and theirs), also
 * updates that active job's live location for the customer's tracking map.
 * Body: { lat, lng, booking_id? }
 */
export const POST = safe(async (req: NextRequest) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "provider") return error("Providers only", 403);

  let body: { lat?: number; lng?: number; booking_id?: string };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  if (typeof body.lat !== "number" || typeof body.lng !== "number") {
    return error("lat and lng are required");
  }

  await sql`UPDATE provider_profiles SET lat = ${body.lat}, lng = ${body.lng} WHERE user_id = ${auth.sub}`;

  if (body.booking_id) {
    await sql`
      UPDATE bookings
      SET provider_lat = ${body.lat}, provider_lng = ${body.lng}, provider_location_at = now()
      WHERE id = ${body.booking_id} AND provider_id = ${auth.sub}
    `;
  }
  return json({ ok: true });
});
