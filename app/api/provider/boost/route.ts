import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";
import { BOOST_PLANS, chargeWallet } from "@/lib/wallet";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** POST /api/provider/boost — purchase a visibility boost, charged from the wallet. */
export const POST = safe(async (req: NextRequest) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "provider") return error("Providers only", 403);

  let body: { plan?: string };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  const plan = body.plan ? BOOST_PLANS[body.plan] : null;
  if (!plan) return error("Unknown boost plan");

  // Charge the plan price from the provider's prepaid wallet first.
  const charge = await chargeWallet(auth.sub, plan.price, "boost", `Profile boost — ${body.plan}`);
  if (!charge.ok) {
    return error(`Not enough wallet balance to boost. Top up at least $${plan.price.toFixed(2)} and try again.`, 402);
  }

  // Boost ONLY buys placement (boost_until). It must never grant the "Pro"/verified trust
  // badge — that has to be earned (verification + track record), not purchased.
  const rows = await sql`
    UPDATE provider_profiles SET
      boost_until = now() + (${plan.hours} || ' hours')::interval
    WHERE user_id = ${auth.sub}
    RETURNING boost_until, is_pro
  `;
  return json({ ok: true, balance: charge.balance, ...rows[0] });
});
