import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** GET /api/jobs — the signed-in customer's posted jobs (with bid counts). */
export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);

  const jobs = await sql`
    SELECT j.*, COUNT(b.id)::int AS bid_count
    FROM jobs j LEFT JOIN bids b ON b.job_id = j.id
    WHERE j.customer_id = ${auth.sub}
    GROUP BY j.id
    ORDER BY j.created_at DESC
  `;
  return json({ jobs });
}

/** POST /api/jobs — post a new job (open for bids). */
export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);

  let body: {
    title?: string;
    category?: string;
    description?: string;
    budget_min?: number;
    budget_max?: number;
    when_text?: string;
    location?: string;
    photos?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  if (!body.title) return error("title is required");
  const photos = Array.isArray(body.photos) ? body.photos.slice(0, 6) : null;

  const rows = await sql`
    INSERT INTO jobs (customer_id, title, category, description, budget_min, budget_max, when_text, location, photos)
    VALUES (${auth.sub}, ${body.title}, ${body.category ?? null}, ${body.description ?? null},
            ${body.budget_min ?? null}, ${body.budget_max ?? null}, ${body.when_text ?? null}, ${body.location ?? null},
            ${photos})
    RETURNING *
  `;
  return json({ job: rows[0] }, { status: 201 });
}
