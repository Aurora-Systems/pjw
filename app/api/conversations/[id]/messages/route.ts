import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";
import { notify } from "@/lib/notify";
import { hasContactInfo } from "@/lib/moderation";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

async function assertMember(conversationId: string, userId: string) {
  const rows = await sql`
    SELECT id FROM conversations
    WHERE id = ${conversationId} AND (customer_id = ${userId} OR provider_id = ${userId})
  `;
  return rows.length > 0;
}

/** GET /api/conversations/:id/messages — full thread (also marks incoming read). */
export const GET = safe(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  const { id } = await params;
  if (!(await assertMember(id, auth.sub))) return error("Conversation not found", 404);

  // Incremental fetch: with ?after=<ISO timestamp> only newer messages are returned, so the
  // poll doesn't re-download the whole thread every few seconds.
  const after = req.nextUrl.searchParams.get("after");
  const messages = after
    ? await sql`
        SELECT id, sender_id, body, read_at, created_at FROM messages
        WHERE conversation_id = ${id} AND created_at > ${after}
        ORDER BY created_at ASC`
    : await sql`
        SELECT id, sender_id, body, read_at, created_at FROM messages
        WHERE conversation_id = ${id}
        ORDER BY created_at ASC`;

  // Mark incoming messages read (only if there could be unread ones — i.e. a full or fresh fetch).
  if (messages.length > 0) {
    await sql`
      UPDATE messages SET read_at = now()
      WHERE conversation_id = ${id} AND sender_id <> ${auth.sub} AND read_at IS NULL
    `;
  }
  return json({ messages });
});

/** POST /api/conversations/:id/messages — send a message. */
export const POST = safe(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  const { id } = await params;

  const convo = await sql`SELECT customer_id, provider_id FROM conversations WHERE id = ${id}`;
  if (convo.length === 0) return error("Conversation not found", 404);
  if (convo[0].customer_id !== auth.sub && convo[0].provider_id !== auth.sub) {
    return error("Conversation not found", 404);
  }
  const recipient = convo[0].customer_id === auth.sub ? convo[0].provider_id : convo[0].customer_id;

  // Respect blocks in either direction.
  const blocked = await sql`
    SELECT 1 FROM user_blocks
    WHERE (blocker_id = ${auth.sub} AND blocked_id = ${recipient})
       OR (blocker_id = ${recipient} AND blocked_id = ${auth.sub})
    LIMIT 1
  `;
  if (blocked.length > 0) return error("You can't message this user.", 403);

  let body: { body?: string };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  if (!body.body?.trim()) return error("Message body is required");

  const text = body.body.trim();
  const flagged = hasContactInfo(text); // off-platform contact attempt — flag for review
  const rows = await sql`
    INSERT INTO messages (conversation_id, sender_id, body, flagged)
    VALUES (${id}, ${auth.sub}, ${text}, ${flagged})
    RETURNING id, sender_id, body, read_at, created_at, flagged
  `;

  if (recipient) {
    await notify(recipient, "messages", auth.name || "New message", text.slice(0, 120), {
      entity: "chat",
      id,
    });
  }
  return json({ message: rows[0] }, { status: 201 });
});
