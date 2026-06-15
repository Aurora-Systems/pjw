import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** GET /api/addresses — the user's saved addresses. */
export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  const addresses = await sql`
    SELECT id, label, address, lat, lng FROM saved_addresses
    WHERE user_id = ${auth.sub} ORDER BY created_at DESC
  `;
  return json({ addresses });
}

/** POST /api/addresses — save an address. Body: { label?, address, lat?, lng? }. */
export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  let body: { label?: string; address?: string; lat?: number; lng?: number };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  if (!body.address?.trim()) return error("address is required");
  const rows = await sql`
    INSERT INTO saved_addresses (user_id, label, address, lat, lng)
    VALUES (${auth.sub}, ${body.label ?? null}, ${body.address.trim()}, ${body.lat ?? null}, ${body.lng ?? null})
    RETURNING id, label, address, lat, lng
  `;
  return json({ address: rows[0] }, { status: 201 });
}
