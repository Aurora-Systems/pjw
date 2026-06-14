import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

const MAX_BYTES = 6 * 1024 * 1024; // 6MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * POST /api/uploads — store an image. Body: { kind?, mime, data (base64, no data: prefix) }.
 * Returns { id, url }. The bytes live in Postgres (bytea) and are served by GET /api/uploads/:id.
 */
export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);

  let body: { kind?: string; mime?: string; data?: string };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  let { mime, data } = body;
  if (!mime || !data) return error("mime and data are required");

  // Accept full data URLs too.
  const m = data.match(/^data:([^;]+);base64,(.*)$/);
  if (m) {
    mime = m[1];
    data = m[2];
  }
  if (!ALLOWED.includes(mime)) return error("Unsupported image type");

  const bytes = Math.ceil((data.length * 3) / 4);
  if (bytes > MAX_BYTES) return error("Image too large (max 6MB)", 413);

  const rows = await sql`
    INSERT INTO uploads (owner_id, kind, mime, data, byte_size)
    VALUES (${auth.sub}, ${body.kind ?? "other"}, ${mime}, decode(${data}, 'base64'), ${bytes})
    RETURNING id
  `;
  const id = rows[0].id;
  return json({ id, url: `/api/uploads/${id}` }, { status: 201 });
}
