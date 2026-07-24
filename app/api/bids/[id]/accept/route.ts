import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";
import { notify } from "@/lib/notify";
import { sendEmail, bidAcceptedEmail } from "@/lib/email";
import { canTakeWork, deductCommission } from "@/lib/wallet";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * POST /api/bids/:id/accept — the job owner hires a bidder.
 *
 * A job can need more than one worker (jobs.workers_needed). The customer accepts one bid
 * per hire, so this route is called once per person. Each accept:
 *   - claims one slot (hired_count + 1),
 *   - marks that bid accepted and creates a confirmed booking for that provider,
 *   - charges that provider the 10% commission.
 * The job stays 'open' (and keeps taking bids) while it is partially staffed, and flips to
 * 'assigned' on the final hire — at which point the remaining pending bids are declined.
 */
export const POST = safe(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await getAuth(_req);
  if (!auth) return error("Unauthorized", 401);

  const { id } = await params;
  const bidRows = await sql`
    SELECT b.*, j.customer_id, j.title AS job_title, j.location, j.lat, j.lng,
           j.when_text AS job_when_text,
           pr.email AS provider_email, pr.full_name AS provider_name,
           cu.full_name AS customer_name
    FROM bids b
    JOIN jobs j ON j.id = b.job_id
    JOIN users pr ON pr.id = b.provider_id
    JOIN users cu ON cu.id = j.customer_id
    WHERE b.id = ${id}
  `;
  if (bidRows.length === 0) return error("Bid not found", 404);
  const bid = bidRows[0];
  if (bid.customer_id !== auth.sub) return error("Not your job", 403);

  // The provider takes the job here, so they need a positive balance and pay the 10% commission.
  if (!(await canTakeWork(bid.provider_id))) {
    return error("This provider is not currently accepting jobs. Please choose another bid.", 409);
  }

  // Accept the bid AND claim one slot in a single statement.
  //
  // The BID row is deliberately the first UPDATE target: under READ COMMITTED, a blocked
  // UPDATE re-checks its qual (EvalPlanQual) against the *row it is updating*, but sub-selects
  // on OTHER tables still read its original snapshot. So gating the jobs UPDATE on
  // `EXISTS (SELECT ... FROM bids WHERE status='pending')` does NOT stop a concurrent duplicate:
  // the loser would still see the bid as pending and claim a second slot — double booking,
  // double commission. Updating `bids` first makes the bid's own row the contended row, so the
  // loser's `status = 'pending'` qual is re-checked and matches nothing, and the jobs UPDATE
  // (which keys off `accepted`) then has no job_id to act on.
  const rows = await sql`
    WITH accepted AS (
      UPDATE bids SET status = 'accepted'
      WHERE id = ${id} AND status = 'pending'
      RETURNING id, job_id
    ), slot AS (
      UPDATE jobs j
      SET hired_count = j.hired_count + 1,
          status = CASE WHEN j.hired_count + 1 >= j.workers_needed THEN 'assigned' ELSE j.status END
      WHERE j.id = (SELECT job_id FROM accepted)
        AND j.status = 'open'
        AND j.hired_count < j.workers_needed
      RETURNING j.hired_count, j.workers_needed
    )
    SELECT
      (SELECT COUNT(*)::int FROM accepted) AS bid_taken,
      (SELECT hired_count FROM slot)       AS hired_count,
      (SELECT workers_needed FROM slot)    AS workers_needed
  `;

  const bidTaken = Number(rows[0].bid_taken) > 0;
  if (!bidTaken) {
    return error("That bid is no longer pending — it may already have been accepted.", 409);
  }
  if (rows[0].hired_count === null) {
    // The bid flipped to 'accepted' but no slot was free (the job filled up, or was closed,
    // concurrently). Put the bid back so it isn't stranded in a hired state with no booking.
    await sql`UPDATE bids SET status = 'pending' WHERE id = ${id} AND status = 'accepted'`;
    return error("This job is already fully staffed.", 409);
  }

  const hired = Number(rows[0].hired_count);
  const workersNeeded = Number(rows[0].workers_needed);
  const full = hired >= workersNeeded;

  // The HTTP driver gives each statement its own implicit transaction, so there is no rollback
  // across the writes below. If the booking or the commission fails we must hand the slot back
  // ourselves, or it is burned forever and the job can never be fully staffed.
  let booking;
  try {
    booking = await sql`
      INSERT INTO bookings (customer_id, provider_id, job_id, service, address, lat, lng, total, status)
      VALUES (${bid.customer_id}, ${bid.provider_id}, ${bid.job_id}, ${bid.job_title},
              ${bid.location ?? null}, ${bid.lat ?? null}, ${bid.lng ?? null}, ${bid.price}, 'confirmed')
      RETURNING *
    `;
    // Take the 10% platform commission from the provider's prepaid balance.
    await deductCommission(bid.provider_id, booking[0].id, Number(bid.price), `Commission — ${bid.job_title}`);
  } catch (e) {
    if (booking?.[0]) await sql`DELETE FROM bookings WHERE id = ${booking[0].id}`;
    await sql`
      UPDATE jobs
      SET hired_count = GREATEST(hired_count - 1, 0),
          status = CASE WHEN status = 'assigned' THEN 'open' ELSE status END
      WHERE id = ${bid.job_id}
    `;
    await sql`UPDATE bids SET status = 'pending' WHERE id = ${id} AND status = 'accepted'`;
    throw e;
  }

  // Only close the door once every slot is filled — a partially staffed job keeps its bids.
  if (full) {
    await sql`
      UPDATE bids SET status = 'declined'
      WHERE job_id = ${bid.job_id} AND id <> ${id} AND status = 'pending'
    `;
  }

  const bookingId = booking[0].id as string;

  // In-app + push, deep-linked to the shared job page.
  await notify(bid.provider_id, "jobs", "Your bid was accepted", `You won the job: ${bid.job_title}`, {
    entity: "booking",
    id: bookingId,
  });

  // Email the provider — winning a bid is the highest-value off-app event they can get.
  // Best-effort: sendEmail() no-ops without Resend config and never throws, but guard anyway so a
  // mail failure can never roll back a hire that already took commission.
  try {
    if (bid.provider_email) {
      await sendEmail(
        String(bid.provider_email),
        `Your bid was accepted — ${bid.job_title}`,
        bidAcceptedEmail({
          providerName: String(bid.provider_name ?? "there"),
          customerName: String(bid.customer_name ?? "The client"),
          jobTitle: String(bid.job_title),
          price: String(bid.price),
          location: bid.location ? String(bid.location) : null,
          whenText: bid.job_when_text ? String(bid.job_when_text) : null,
          bookingId,
        })
      );
    }
  } catch (e) {
    console.error("[bid accepted email] failed:", e);
  }

  return json(
    { booking: booking[0], hired_count: hired, workers_needed: workersNeeded, fully_staffed: full },
    { status: 201 }
  );
});
