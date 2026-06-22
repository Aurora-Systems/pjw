import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { json, error, safe } from "@/lib/http";
import { checkPayment, mapStatus, confirmedUsdAmount } from "@/lib/pesepay";
import { creditTopup } from "@/lib/wallet";

export const runtime = "nodejs";

/**
 * GET/POST /api/cron/reconcile-payments — re-check Pesepay top-ups that are still 'pending'
 * (e.g. the webhook was missed or the app was killed before the status poll). Credits any
 * that have since been paid. Idempotent (creditTopup dedups by reference).
 *
 * Protect with CRON_SECRET: call with header `x-cron-secret: <CRON_SECRET>`. Wire this to a
 * scheduled trigger (Netlify scheduled function / cron-job.org / GitHub Action) every ~5 min.
 */
async function run(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return error("CRON_SECRET is not configured", 503);
  const provided = req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("key");
  if (provided !== secret) return error("Forbidden", 403);

  // Only top-ups still pending, old enough that the live flow has had its chance, but not
  // ancient (a stale unpaid attempt should expire, not be retried forever).
  const pending = await sql`
    SELECT id, user_id, reference_number, amount
    FROM payments
    WHERE kind = 'topup' AND status = 'pending'
      AND created_at < now() - interval '2 minutes'
      AND created_at > now() - interval '3 days'
    ORDER BY created_at ASC
    LIMIT 100
  `;

  let credited = 0;
  let stillPending = 0;
  let failed = 0;
  const reviews: string[] = [];

  for (const p of pending) {
    try {
      const tx = await checkPayment(p.reference_number);
      const status = mapStatus(tx);
      await sql`
        UPDATE payments SET status = ${status}, raw_status = ${tx.transactionStatus ?? null}, updated_at = now()
        WHERE id = ${p.id}
      `;
      if (status === "paid") {
        const paid = confirmedUsdAmount(tx);
        if (paid != null && Math.abs(paid - Number(p.amount)) <= 0.01) {
          await creditTopup(p.user_id, paid, p.reference_number);
          credited++;
        } else {
          await sql`UPDATE payments SET status = 'review' WHERE id = ${p.id}`;
          reviews.push(p.reference_number);
        }
      } else if (status === "pending") {
        stillPending++;
      } else {
        failed++;
      }
    } catch (e) {
      console.error(`[reconcile] ${p.reference_number}:`, e);
    }
  }

  return json({ checked: pending.length, credited, stillPending, failed, flaggedForReview: reviews.length });
}

export const GET = safe(run);
export const POST = safe(run);
