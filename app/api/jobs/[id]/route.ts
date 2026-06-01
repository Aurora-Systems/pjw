import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
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

  const jobs = await sql`SELECT * FROM jobs WHERE id = ${id}`;
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
