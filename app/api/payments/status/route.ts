import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";
import { checkPayment, mapStatus, confirmedUsdAmount } from "@/lib/pesepay";
import { creditTopup } from "@/lib/wallet";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * GET /api/payments/status?reference=... — re-check a payment with Pesepay and
 * reconcile our records. Returns { status, paid }.
 */
export const GET = safe(async (req: NextRequest) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);

  const reference = req.nextUrl.searchParams.get("reference");
  if (!reference) return error("reference is required");

  const rows = await sql`
    SELECT id, booking_id, status, kind, amount FROM payments
    WHERE reference_number = ${reference} AND user_id = ${auth.sub}
  `;
  if (rows.length === 0) return error("Payment not found", 404);
  const payment = rows[0];

  let status = payment.status as string;
  try {
    const tx = await checkPayment(reference);
    status = mapStatus(tx);
    await sql`
      UPDATE payments SET status = ${status}, raw_status = ${tx.transactionStatus ?? null}, updated_at = now()
      WHERE id = ${payment.id}
    `;
    if (status === "paid" && payment.kind === "topup") {
      // Credit Pesepay's confirmed amount (idempotent by reference); flag any mismatch.
      const paid = confirmedUsdAmount(tx);
      if (paid != null && Math.abs(paid - Number(payment.amount)) <= 0.01) {
        await creditTopup(auth.sub, paid, reference);
      } else {
        await sql`UPDATE payments SET status = 'review' WHERE id = ${payment.id}`;
        status = "review";
        console.error(`Topup amount mismatch ref=${reference}: confirmed=${paid} expected=${payment.amount}`);
      }
    } else if (payment.booking_id) {
      if (status === "paid") {
        await sql`UPDATE bookings SET payment_status = 'paid', paid_at = now() WHERE id = ${payment.booking_id}`;
      } else if (status === "failed" || status === "cancelled") {
        await sql`UPDATE bookings SET payment_status = 'unpaid' WHERE id = ${payment.booking_id} AND payment_status <> 'paid'`;
      }
    }
  } catch (e) {
    return error(e instanceof Error ? e.message : "Could not check payment", 502);
  }

  return json({ status, paid: status === "paid" });
});
