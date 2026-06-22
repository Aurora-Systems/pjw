import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";
import { chargeWallet, BOOST_BID_FEE } from "@/lib/wallet";
import { notify } from "@/lib/notify";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** POST /api/jobs/:id/bids — a provider submits a bid on a job. */
export const POST = safe(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "provider") return error("Only providers can bid", 403);

  // Providers must be ID-verified (in-person cash jobs) AND have a positive balance.
  // Checked explicitly here so the provider gets the right reason to act on.
  const elig = await sql`
    SELECT pp.balance, u.id_verified
    FROM provider_profiles pp JOIN users u ON u.id = pp.user_id
    WHERE pp.user_id = ${auth.sub}
  `;
  if (elig.length === 0) return error("Finish setting up your provider profile first.", 403);
  if (!elig[0].id_verified) return error("Verify your identity before bidding for jobs.", 403);
  if (Number(elig[0].balance) <= 0) return error("Top up your PocketJobs balance to bid for jobs.", 402);

  const { id } = await params;
  let body: { price?: number; start_text?: string; message?: string; boosted?: boolean };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  if (body.price == null) return error("price is required");

  const job = await sql`SELECT id, status, customer_id, title FROM jobs WHERE id = ${id}`;
  if (job.length === 0) return error("Job not found", 404);
  if (job[0].status !== "open") return error("This job is no longer open for bids", 409);

  // Boosting a bid costs a fee from the wallet — but only the first time this bid
  // becomes boosted (re-submitting an already-boosted bid is free).
  const existing = await sql`SELECT boosted FROM bids WHERE job_id = ${id} AND provider_id = ${auth.sub}`;
  const wantsBoost = body.boosted === true;
  const alreadyBoosted = existing.length > 0 && existing[0].boosted === true;
  if (wantsBoost && !alreadyBoosted) {
    const charge = await chargeWallet(auth.sub, BOOST_BID_FEE, "boost", "Boosted bid");
    if (!charge.ok) {
      return error(
        `Not enough wallet balance to boost this bid ($${BOOST_BID_FEE.toFixed(2)}). Submit without boost or top up.`,
        402
      );
    }
  }

  const rows = await sql`
    INSERT INTO bids (job_id, provider_id, price, start_text, message, boosted)
    VALUES (${id}, ${auth.sub}, ${body.price}, ${body.start_text ?? null}, ${body.message ?? null}, ${body.boosted ?? false})
    ON CONFLICT (job_id, provider_id)
    DO UPDATE SET price = EXCLUDED.price, start_text = EXCLUDED.start_text,
                  message = EXCLUDED.message, boosted = EXCLUDED.boosted
    RETURNING *
  `;

  // Tell the customer about a NEW bid (not a re-submit) so they come look.
  if (existing.length === 0) {
    await notify(
      job[0].customer_id,
      "jobs",
      "New bid on your job",
      `You received a $${Number(body.price).toFixed(2)} bid on "${job[0].title}".`,
      { entity: "job", id }
    );
  }
  return json({ bid: rows[0] }, { status: 201 });
});
