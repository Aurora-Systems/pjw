import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * POST /api/bids/:id/accept — the job owner accepts a bid.
 * Marks the bid accepted, the job assigned, declines other bids, and
 * creates a confirmed booking.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  await sql`UPDATE bids SET status = 'accepted' WHERE id = ${id}`;
  await sql`UPDATE bids SET status = 'declined' WHERE job_id = ${bid.job_id} AND id <> ${id}`;
  await sql`UPDATE jobs SET status = 'assigned' WHERE id = ${bid.job_id}`;

  const booking = await sql`
    INSERT INTO bookings (customer_id, provider_id, job_id, service, address, total, status)
    VALUES (${bid.customer_id}, ${bid.provider_id}, ${bid.job_id}, ${bid.job_title},
            ${bid.location ?? null}, ${bid.price}, 'confirmed')
    RETURNING *
  `;

  await sql`
    INSERT INTO notifications (user_id, type, title, body)
    VALUES (${bid.provider_id}, 'jobs', 'Your bid was accepted', ${"You won the job: " + bid.job_title})
  `;

  return json({ booking: booking[0] }, { status: 201 });
}
