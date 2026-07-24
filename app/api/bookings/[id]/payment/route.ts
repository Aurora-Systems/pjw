import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";
import { notify } from "@/lib/notify";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * PATCH /api/bookings/:id/payment — confirm the customer has paid.
 *
 * Jobs on PocketJobs are CASH-ONLY and settle directly between the two people (see
 * app/api/payments/initiate — online job payments are disabled), so there is no gateway callback
 * to flip this. The PROVIDER is the authority: they physically receive the cash, so only they can
 * confirm it. Letting the customer self-declare "paid" would let them mark a job settled that the
 * provider never got paid for.
 *
 * Body: { paid: true } (idempotent — confirming twice is a no-op).
 */
export const PATCH = safe(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  const { id } = await params;

  const rows = await sql`
    SELECT id, customer_id, provider_id, status, payment_status, total, service
    FROM bookings
    WHERE id = ${id} AND (customer_id = ${auth.sub} OR provider_id = ${auth.sub})
  `;
  if (rows.length === 0) return error("Booking not found", 404);
  const booking = rows[0];

  if (auth.sub !== booking.provider_id) {
    return error("Only the provider can confirm they received payment.", 403);
  }
  if (booking.status === "cancelled") {
    return error("This booking was cancelled.", 409);
  }
  if (booking.payment_status === "paid") {
    return json({ booking }); // already confirmed — idempotent
  }

  const updated = await sql`
    UPDATE bookings SET payment_status = 'paid', paid_at = now()
    WHERE id = ${id} AND payment_status <> 'paid'
    RETURNING *
  `;
  // Lost the race to a concurrent confirm — the end state is the same, so report success.
  if (updated.length === 0) return json({ booking });

  await notify(
    booking.customer_id,
    "payments",
    "Payment confirmed",
    `${booking.service ?? "Your job"} — the provider confirmed receiving $${booking.total ?? "0"}.`,
    { entity: "booking", id }
  );

  return json({ booking: updated[0] });
});
