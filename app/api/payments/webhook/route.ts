import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { checkPayment, mapStatus, confirmedUsdAmount } from "@/lib/pesepay";
import { creditTopup } from "@/lib/wallet";

export const runtime = "nodejs";

/**
 * POST /api/payments/webhook — Pesepay result URL.
 * Pesepay calls this server-to-server when a transaction resolves. We never trust
 * the body; we re-check the status with Pesepay using the reference number, then
 * reconcile the booking. (Also accepts GET as some gateways ping with a query.)
 */
async function reconcile(reference: string | null) {
  if (!reference) return;
  const rows = await sql`SELECT id, booking_id, user_id, kind, amount FROM payments WHERE reference_number = ${reference}`;
  if (rows.length === 0) return;
  const payment = rows[0];

  const tx = await checkPayment(reference);
  const status = mapStatus(tx);
  await sql`
    UPDATE payments SET status = ${status}, raw_status = ${tx.transactionStatus ?? null}, updated_at = now()
    WHERE id = ${payment.id}
  `;
  if (status === "paid" && payment.kind === "topup") {
    // Credit the AMOUNT PESEPAY CONFIRMS (not what we requested), and only if it matches
    // the requested amount. A mismatch is flagged for manual review, never auto-credited.
    const paid = confirmedUsdAmount(tx);
    if (paid != null && Math.abs(paid - Number(payment.amount)) <= 0.01) {
      await creditTopup(payment.user_id, paid, reference); // idempotent by reference
    } else {
      await sql`UPDATE payments SET status = 'review' WHERE id = ${payment.id}`;
      console.error(`Topup amount mismatch ref=${reference}: confirmed=${paid} expected=${payment.amount}`);
    }
  } else if (payment.booking_id && status === "paid") {
    await sql`UPDATE bookings SET payment_status = 'paid', paid_at = now() WHERE id = ${payment.booking_id}`;
  }
}

function extractReference(body: unknown, req: NextRequest): string | null {
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    const v = b.referenceNumber || b.reference || b.reference_number;
    if (typeof v === "string") return v;
  }
  return req.nextUrl.searchParams.get("referenceNumber") || req.nextUrl.searchParams.get("reference");
}

export async function POST(req: NextRequest) {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }
  try {
    await reconcile(extractReference(body, req));
  } catch {
    // swallow — respond 200 so Pesepay doesn't retry-storm; status route is the fallback.
  }
  return new NextResponse("OK", { status: 200 });
}

export async function GET(req: NextRequest) {
  try {
    await reconcile(extractReference(null, req));
  } catch {
    /* ignore */
  }
  return new NextResponse("OK", { status: 200 });
}
