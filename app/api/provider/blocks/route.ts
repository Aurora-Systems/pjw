import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** GET /api/provider/blocks — the provider's unavailability blocks (optionally within ?from&to). */
export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "provider") return error("Providers only", 403);
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  const blocks = await sql`
    SELECT id, start_at, end_at, reason FROM provider_blocks
    WHERE provider_id = ${auth.sub}
      AND (${from}::timestamptz IS NULL OR end_at >= ${from})
      AND (${to}::timestamptz IS NULL OR start_at <= ${to})
    ORDER BY start_at ASC
  `;
  return json({ blocks });
}

/** POST /api/provider/blocks — block a time range. Body: { start_at, end_at, reason? }. */
export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "provider") return error("Providers only", 403);
  let body: { start_at?: string; end_at?: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  if (!body.start_at || !body.end_at) return error("start_at and end_at are required");
  const rows = await sql`
    INSERT INTO provider_blocks (provider_id, start_at, end_at, reason)
    VALUES (${auth.sub}, ${body.start_at}, ${body.end_at}, ${body.reason ?? null})
    RETURNING id, start_at, end_at, reason
  `;
  return json({ block: rows[0] }, { status: 201 });
}
