import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** GET /api/notifications — the signed-in user's notifications. */
export const GET = safe(async (req: NextRequest) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);

  const notifications = await sql`
    SELECT id, type, title, body, read, created_at
    FROM notifications WHERE user_id = ${auth.sub}
    ORDER BY created_at DESC LIMIT 50
  `;
  return json({ notifications });
});
