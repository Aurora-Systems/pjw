import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** GET /api/jobs/:id — job detail with its bids (provider info joined). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const jobs = await sql`
    SELECT j.*, u.full_name AS customer_name, u.avatar_url AS customer_avatar_url,
           u.client_rating, u.client_reviews_count
    FROM jobs j JOIN users u ON u.id = j.customer_id
    WHERE j.id = ${id}
  `;
  if (jobs.length === 0) return error("Job not found", 404);

  const bids = await sql`
    SELECT b.id, b.price, b.start_text, b.message, b.boosted, b.status, b.created_at,
           u.id AS provider_id, u.full_name AS provider_name, u.avatar_url,
           pp.rating, pp.reviews_count, pp.is_pro, pp.is_top_rated
    FROM bids b
    JOIN users u ON u.id = b.provider_id
    LEFT JOIN provider_profiles pp ON pp.user_id = u.id
    WHERE b.job_id = ${id}
    ORDER BY b.boosted DESC, b.created_at ASC
  `;
  return json({ job: jobs[0], bids });
}

/** PATCH /api/jobs/:id — the poster cancels their job (only while it's still open). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  const { id } = await params;

  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  if (body.status !== "cancelled") {
    return error("Only cancellation is supported here.");
  }

  // Owner-only, and only an open job can be cancelled (assigned jobs are cancelled via the booking).
  const updated = await sql`
    UPDATE jobs SET status = 'cancelled'
    WHERE id = ${id} AND customer_id = ${auth.sub} AND status = 'open'
    RETURNING *
  `;
  if (updated.length === 0) {
    return error("This job can't be cancelled (already assigned, closed, or not yours).", 409);
  }
  return json({ job: updated[0] });
}
