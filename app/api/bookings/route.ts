import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";
import { notify } from "@/lib/notify";
import { canTakeWork, deductCommission } from "@/lib/wallet";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * GET /api/bookings — bookings for the signed-in user.
 * Customers see bookings they made; providers see bookings assigned to them.
 */
export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);

  const column = auth.role === "provider" ? "provider_id" : "customer_id";
  const otherName = auth.role === "provider" ? "cu.full_name" : "pr.full_name";
  // The counterparty's reputation: a provider sees the client's rating; a customer sees the provider's.
  const otherRating = auth.role === "provider" ? "cu.client_rating" : "pp.rating";
  const otherRatingCount =
    auth.role === "provider" ? "cu.client_reviews_count" : "pp.reviews_count";

  const text = `
    SELECT b.*, ${otherName} AS counterparty_name,
           ${otherRating} AS counterparty_rating,
           ${otherRatingCount} AS counterparty_reviews_count
    FROM bookings b
    JOIN users cu ON cu.id = b.customer_id
    JOIN users pr ON pr.id = b.provider_id
    LEFT JOIN provider_profiles pp ON pp.user_id = b.provider_id
    WHERE b.${column} = $1
    ORDER BY b.created_at DESC
  `;
  const bookings = await sql.query(text, [auth.sub]);
  return json({ bookings });
}

/** POST /api/bookings — direct booking of a provider (no open-bid flow). */
export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);

  let body: {
    provider_id?: string;
    service?: string;
    scheduled_at?: string;
    address?: string;
    notes?: string;
    total?: number;
    payment_method?: string;
    lat?: number;
    lng?: number;
  };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  if (!body.provider_id || !body.service) {
    return error("provider_id and service are required");
  }

  // The provider takes this job on booking, so they must have a positive balance.
  if (!(await canTakeWork(body.provider_id))) {
    return error("This provider isn't accepting bookings right now. Please try another provider.", 409);
  }

  const rows = await sql`
    INSERT INTO bookings (customer_id, provider_id, service, scheduled_at, address, notes, total, payment_method, lat, lng)
    VALUES (${auth.sub}, ${body.provider_id}, ${body.service}, ${body.scheduled_at ?? null},
            ${body.address ?? null}, ${body.notes ?? null}, ${body.total ?? null}, ${body.payment_method ?? null},
            ${body.lat ?? null}, ${body.lng ?? null})
    RETURNING *
  `;

  // Take the 10% platform commission from the provider's prepaid balance.
  await deductCommission(body.provider_id, rows[0].id, Number(body.total ?? 0), `Commission — ${body.service}`);

  await notify(body.provider_id, "jobs", "New booking", `You have a new booking: ${body.service}`);

  return json({ booking: rows[0] }, { status: 201 });
}
