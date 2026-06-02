import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";

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
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  const { id } = await params;
  if (!(await assertMember(id, auth.sub))) return error("Conversation not found", 404);

  const messages = await sql`
    SELECT id, sender_id, body, read_at, created_at
    FROM messages WHERE conversation_id = ${id}
    ORDER BY created_at ASC
  `;
  await sql`
    UPDATE messages SET read_at = now()
    WHERE conversation_id = ${id} AND sender_id <> ${auth.sub} AND read_at IS NULL
  `;
  return json({ messages });
}

/** POST /api/conversations/:id/messages — send a message. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  const { id } = await params;
  if (!(await assertMember(id, auth.sub))) return error("Conversation not found", 404);

  let body: { body?: string };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  if (!body.body?.trim()) return error("Message body is required");

  const rows = await sql`
    INSERT INTO messages (conversation_id, sender_id, body)
    VALUES (${id}, ${auth.sub}, ${body.body.trim()})
    RETURNING id, sender_id, body, read_at, created_at
  `;
  return json({ message: rows[0] }, { status: 201 });
}
