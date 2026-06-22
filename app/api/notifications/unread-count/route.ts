import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** GET /api/notifications/unread-count — { notifications, messages } unread counts for badges. */
export const GET = safe(async (req: NextRequest) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);

  const [notif, msg] = await Promise.all([
    sql`SELECT count(*)::int AS n FROM notifications WHERE user_id = ${auth.sub} AND read = false`,
    sql`
      SELECT count(*)::int AS n
      FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE (c.customer_id = ${auth.sub} OR c.provider_id = ${auth.sub})
        AND m.sender_id <> ${auth.sub} AND m.read_at IS NULL
    `,
  ]);

  return json({ notifications: notif[0].n, messages: msg[0].n });
});
