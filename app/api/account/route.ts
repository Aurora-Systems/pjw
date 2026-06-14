import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** PATCH /api/account — update the signed-in user's name / avatar / city. */
export async function PATCH(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);

  let body: { full_name?: string; avatar_url?: string; city?: string };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }

  const rows = await sql`
    UPDATE users SET
      full_name = COALESCE(${body.full_name ?? null}, full_name),
      avatar_url = COALESCE(${body.avatar_url ?? null}, avatar_url),
      city = COALESCE(${body.city ?? null}, city)
    WHERE id = ${auth.sub}
    RETURNING id, full_name, email, avatar_url, city, role
  `;
  return json({ user: rows[0] });
}
