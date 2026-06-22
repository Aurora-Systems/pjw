import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** POST /api/notifications/read — mark one (by id) or all notifications read. */
export const POST = safe(async (req: NextRequest) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);

  let body: { id?: string };
  try {
    body = await req.json().catch(() => ({}));
  } catch {
    body = {};
  }

  if (body.id) {
    await sql`UPDATE notifications SET read = true WHERE id = ${body.id} AND user_id = ${auth.sub}`;
  } else {
    await sql`UPDATE notifications SET read = true WHERE user_id = ${auth.sub} AND read = false`;
  }
  return json({ ok: true });
});
