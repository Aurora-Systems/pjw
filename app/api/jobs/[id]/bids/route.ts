import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** POST /api/jobs/:id/bids — a provider submits a bid on a job. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "provider") return error("Only providers can bid", 403);

  const { id } = await params;
  let body: { price?: number; start_text?: string; message?: string; boosted?: boolean };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  if (body.price == null) return error("price is required");

  const job = await sql`SELECT id, status FROM jobs WHERE id = ${id}`;
  if (job.length === 0) return error("Job not found", 404);
  if (job[0].status !== "open") return error("This job is no longer open for bids", 409);

  const rows = await sql`
    INSERT INTO bids (job_id, provider_id, price, start_text, message, boosted)
    VALUES (${id}, ${auth.sub}, ${body.price}, ${body.start_text ?? null}, ${body.message ?? null}, ${body.boosted ?? false})
    ON CONFLICT (job_id, provider_id)
    DO UPDATE SET price = EXCLUDED.price, start_text = EXCLUDED.start_text,
                  message = EXCLUDED.message, boosted = EXCLUDED.boosted
    RETURNING *
  `;
  return json({ bid: rows[0] }, { status: 201 });
}
