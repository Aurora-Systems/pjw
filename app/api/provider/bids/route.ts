import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** GET /api/provider/bids — bids the provider has submitted, with job info. */
export const GET = safe(async (req: NextRequest) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "provider") return error("Providers only", 403);

  const bids = await sql`
    SELECT b.id, b.price, b.start_text, b.message, b.boosted, b.status, b.created_at,
           j.id AS job_id, j.title AS job_title, j.status AS job_status, j.location
    FROM bids b JOIN jobs j ON j.id = b.job_id
    WHERE b.provider_id = ${auth.sub}
    ORDER BY b.created_at DESC
  `;
  return json({ bids });
});
