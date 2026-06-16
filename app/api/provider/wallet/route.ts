import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";
import { getBalance, TOPUP_PACKAGES, COMMISSION_RATE } from "@/lib/wallet";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * GET /api/provider/wallet — the provider's balance, top-up packages, the commission
 * rate, and recent wallet transactions (top-ups + commissions). Replaces the old
 * earnings/payout view (there are no payouts in this model).
 */
export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "provider") return error("Providers only", 403);

  const balance = await getBalance(auth.sub);
  const transactions = await sql`
    SELECT id, type, amount, balance_after, description, created_at
    FROM wallet_transactions
    WHERE provider_id = ${auth.sub}
    ORDER BY created_at DESC
    LIMIT 50
  `;
  const stats = await sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_jobs,
      COALESCE(SUM(total) FILTER (WHERE status = 'completed'), 0)::numeric AS completed_value
    FROM bookings WHERE provider_id = ${auth.sub}
  `;

  return json({
    balance,
    can_take_work: balance > 0,
    commission_rate: COMMISSION_RATE,
    packages: TOPUP_PACKAGES,
    transactions,
    completed_jobs: stats[0].completed_jobs,
    completed_value: stats[0].completed_value,
  });
}
