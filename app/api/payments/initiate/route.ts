import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";
import { initiateTransaction, isPesepayConfigured } from "@/lib/pesepay";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * POST /api/payments/initiate — start a Pesepay hosted-checkout payment for a booking.
 * Body: { booking_id }. Returns { redirectUrl, referenceNumber } for the client to open.
 */
export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (!isPesepayConfigured()) {
    return error("Payments are not configured yet (missing Pesepay keys).", 503);
  }

  let body: { booking_id?: string };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  if (!body.booking_id) return error("booking_id is required");

  const rows = await sql`
    SELECT id, service, total, payment_status FROM bookings
    WHERE id = ${body.booking_id} AND customer_id = ${auth.sub}
  `;
  if (rows.length === 0) return error("Booking not found", 404);
  const booking = rows[0];
  if (booking.payment_status === "paid") return error("This booking is already paid", 409);

  const amount = Number(booking.total ?? 0);
  if (!amount || amount <= 0) return error("Booking has no payable amount");

  const base = process.env.APP_PUBLIC_URL || "http://localhost:3000";
  const currency = process.env.PESEPAY_CURRENCY || "USD";

  let tx;
  try {
    tx = await initiateTransaction({
      amount,
      currencyCode: currency,
      reasonForPayment: booking.service || "PocketJobs booking",
      returnUrl: `${base}/payment/return`,
      resultUrl: `${base}/api/payments/webhook`,
      merchantReference: booking.id,
    });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Could not start payment", 502);
  }

  await sql`
    INSERT INTO payments (booking_id, user_id, reference_number, poll_url, redirect_url, amount, currency, status)
    VALUES (${booking.id}, ${auth.sub}, ${tx.referenceNumber}, ${tx.pollUrl ?? null}, ${tx.redirectUrl ?? null},
            ${amount}, ${currency}, 'pending')
    ON CONFLICT (reference_number) DO NOTHING
  `;
  await sql`UPDATE bookings SET payment_status = 'pending' WHERE id = ${booking.id}`;

  return json({ redirectUrl: tx.redirectUrl, referenceNumber: tx.referenceNumber });
}
