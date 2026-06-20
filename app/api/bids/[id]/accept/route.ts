import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";
import { notify } from "@/lib/notify";
import { canTakeWork, deductCommission } from "@/lib/wallet";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * POST /api/bids/:id/accept — the job owner accepts a bid.
 * Marks the bid accepted, the job assigned, declines other bids, and
 * creates a confirmed booking.
 */
export const POST = safe(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await getAuth(_req);
  if (!auth) return error("Unauthorized", 401);

  const { id } = await params;
  const bidRows = await sql`
    SELECT b.*, j.customer_id, j.title AS job_title, j.location
    FROM bids b JOIN jobs j ON j.id = b.job_id
    WHERE b.id = ${id}
  `;
  if (bidRows.length === 0) return error("Bid not found", 404);
  const bid = bidRows[0];
  if (bid.customer_id !== auth.sub) return error("Not your job", 403);

  // The provider takes the job here, so they need a positive balance and pay the 10% commission.
  if (!(await canTakeWork(bid.provider_id))) {
    return error("This provider is not currently accepting jobs. Please choose another bid.", 409);
  }

  // Atomically claim the job: only the first accept (while it's still 'open') wins. This
  // prevents a double-accept from creating two bookings and charging commission twice.
  const claimed = await sql`
    UPDATE jobs SET status = 'assigned' WHERE id = ${bid.job_id} AND status = 'open' RETURNING id
  `;
  if (claimed.length === 0) return error("This job has already been assigned.", 409);

  await sql`UPDATE bids SET status = 'accepted' WHERE id = ${id}`;
  await sql`UPDATE bids SET status = 'declined' WHERE job_id = ${bid.job_id} AND id <> ${id}`;

  const booking = await sql`
    INSERT INTO bookings (customer_id, provider_id, job_id, service, address, total, status)
    VALUES (${bid.customer_id}, ${bid.provider_id}, ${bid.job_id}, ${bid.job_title},
            ${bid.location ?? null}, ${bid.price}, 'confirmed')
    RETURNING *
  `;

  // Take the 10% platform commission from the provider's prepaid balance.
  await deductCommission(bid.provider_id, booking[0].id, Number(bid.price), `Commission — ${bid.job_title}`);

  await notify(bid.provider_id, "jobs", "Your bid was accepted", `You won the job: ${bid.job_title}`);

  return json({ booking: booking[0] }, { status: 201 });
});
