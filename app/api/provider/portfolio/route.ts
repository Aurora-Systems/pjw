import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";
import { isOurUploadUrl } from "@/lib/r2";

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
    SELECT id, url, created_at
    FROM provider_portfolio WHERE provider_id = ${auth.sub} ORDER BY created_at DESC
  `;
  return json({ portfolio: items });
}

/** POST /api/provider/portfolio — attach an uploaded image (R2 URL) to the portfolio. Body: { url }. */
export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "provider") return error("Providers only", 403);

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  const url = body.url?.trim();
  if (!url) return error("url is required");
  if (!isOurUploadUrl(url)) return error("url must be an uploaded image URL");

  const rows = await sql`
    INSERT INTO provider_portfolio (provider_id, url)
    VALUES (${auth.sub}, ${url})
    RETURNING id, url, created_at
  `;
  return json({ item: rows[0] }, { status: 201 });
}
