import type { NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";
import { parseBody } from "@/lib/validate";
import { notify } from "@/lib/notify";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** GET /api/disputes — disputes the signed-in user raised or is involved in. */
export const GET = safe(async (req: NextRequest) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  const rows = await sql`
    SELECT d.*, b.service, b.customer_id, b.provider_id
    FROM disputes d JOIN bookings b ON b.id = d.booking_id
    WHERE b.customer_id = ${auth.sub} OR b.provider_id = ${auth.sub}
    ORDER BY d.created_at DESC
  `;
  return json({ disputes: rows });
});

const disputeSchema = z.object({
  booking_id: z.string().uuid(),
  reason: z.string().trim().min(5).max(2000),
  category: z.string().trim().max(60).nullish(),
});

/** POST /api/disputes — a party to a booking raises a dispute. */
export const POST = safe(async (req: NextRequest) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  const body = await parseBody(req, disputeSchema);

  const bk = await sql`SELECT id, customer_id, provider_id, total, service FROM bookings WHERE id = ${body.booking_id}`;
  if (bk.length === 0) return error("Booking not found", 404);
  const b = bk[0];
  if (auth.sub !== b.customer_id && auth.sub !== b.provider_id) {
    return error("You can only dispute a booking you were part of", 403);
  }

  // One open dispute per booking per person.
  const dupe = await sql`
    SELECT 1 FROM disputes WHERE booking_id = ${body.booking_id} AND raised_by = ${auth.sub} AND status = 'open'
  `;
  if (dupe.length > 0) return error("You already have an open dispute for this booking.", 409);

  const rows = await sql`
    INSERT INTO disputes (booking_id, raised_by, reason, category, amount, status)
    VALUES (${body.booking_id}, ${auth.sub}, ${body.reason}, ${body.category ?? null}, ${b.total ?? null}, 'open')
    RETURNING *
  `;

  // Tell the counterparty.
  const other = auth.sub === b.customer_id ? b.provider_id : b.customer_id;
  if (other) {
    await notify(other, "disputes", "A dispute was opened", `A dispute was raised on "${b.service}".`, {
      entity: "dispute",
      id: rows[0].id,
    });
  }
  return json({ dispute: rows[0] }, { status: 201 });
});
