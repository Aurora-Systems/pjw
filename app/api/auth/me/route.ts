import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);

  const rows = await sql`
    SELECT id, phone, email, full_name, role, avatar_url, city, id_verified, phone_verified
    FROM users WHERE id = ${auth.sub}
  `;
  if (rows.length === 0) return error("User not found", 404);
  return json({ user: rows[0] });
}
