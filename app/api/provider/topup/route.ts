import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, publicBaseUrl } from "@/lib/http";
import { initiateTransaction, isPesepayConfigured } from "@/lib/pesepay";
import { TOPUP_PACKAGES } from "@/lib/wallet";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * POST /api/provider/topup — start a Pesepay payment to top up the provider's wallet.
 * Body: { amount } (must be one of TOPUP_PACKAGES). Returns { redirectUrl, referenceNumber }.
 * The wallet is credited once the payment is confirmed paid (webhook / status poll).
 */
export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "provider") return error("Providers only", 403);
  if (!isPesepayConfigured()) {
    return error("Payments are not configured yet (missing Pesepay keys).", 503);
  }

  let body: { amount?: number };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  const amount = Number(body.amount);
  if (!TOPUP_PACKAGES.includes(amount)) {
    return error(`amount must be one of: ${TOPUP_PACKAGES.join(", ")}`);
  }

  const base = publicBaseUrl(req);
  const currency = process.env.PESEPAY_CURRENCY || "USD";

  let tx;
  try {
    tx = await initiateTransaction({
      amount,
      currencyCode: currency,
      reasonForPayment: "PocketJobs wallet top-up",
      returnUrl: `${base}/payment/return`,
      resultUrl: `${base}/api/payments/webhook`,
      merchantReference: `topup:${auth.sub}`,
    });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Could not start payment", 502);
  }

  await sql`
    INSERT INTO payments (user_id, kind, reference_number, poll_url, redirect_url, amount, currency, status)
    VALUES (${auth.sub}, 'topup', ${tx.referenceNumber}, ${tx.pollUrl ?? null}, ${tx.redirectUrl ?? null},
            ${amount}, ${currency}, 'pending')
    ON CONFLICT (reference_number) DO NOTHING
  `;

  return json({ redirectUrl: tx.redirectUrl, referenceNumber: tx.referenceNumber });
}
