import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";
import { maskContactInfo } from "@/lib/moderation";

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

  // A chat notification's body is a copy of the message, so it leaks the same contact details
  // the thread hides. Masked on read rather than rewritten in place, which also covers rows
  // stored before masking existed — and keeps the original for moderation.
  // Scoped to 'messages': other types carry amounts and job text that must not be touched.
  const shaped = notifications.map((n) =>
    n.type === "messages" && n.body
      ? { ...n, body: maskContactInfo(n.body as string) }
      : n
  );

  return json({ notifications: shaped });
});
