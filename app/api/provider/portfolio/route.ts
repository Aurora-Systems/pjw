import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** GET /api/provider/portfolio — the signed-in provider's portfolio images. */
export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "provider") return error("Providers only", 403);
  const items = await sql`
    SELECT id, upload_id, '/api/uploads/' || upload_id AS url, created_at
    FROM provider_portfolio WHERE provider_id = ${auth.sub} ORDER BY created_at DESC
  `;
  return json({ portfolio: items });
}

/** POST /api/provider/portfolio — attach an uploaded image to the portfolio. Body: { upload_id }. */
export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "provider") return error("Providers only", 403);

  let body: { upload_id?: string };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  if (!body.upload_id) return error("upload_id is required");

  const rows = await sql`
    INSERT INTO provider_portfolio (provider_id, upload_id)
    VALUES (${auth.sub}, ${body.upload_id})
    RETURNING id, upload_id, '/api/uploads/' || upload_id AS url, created_at
  `;
  return json({ item: rows[0] }, { status: 201 });
}
