import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";
import { notify } from "@/lib/notify";
import { hasContactInfo, maskContactInfo } from "@/lib/moderation";
import { isOurUploadUrl } from "@/lib/r2";

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

/**
 * True once the two people in this conversation share a booking (any status).
 * Used to stop masking contact details — see the note in GET.
 */
async function partiesHaveBooking(conversationId: string): Promise<boolean> {
  const rows = await sql`
    SELECT 1
    FROM conversations c
    JOIN bookings b
      ON b.customer_id = c.customer_id AND b.provider_id = c.provider_id
    WHERE c.id = ${conversationId}
    LIMIT 1
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
        SELECT id, sender_id, body, read_at, created_at,
               attachment_url, attachment_type, attachment_name
        FROM messages
        WHERE conversation_id = ${id} AND created_at > ${after}
        ORDER BY created_at ASC`
    : await sql`
        SELECT id, sender_id, body, read_at, created_at,
               attachment_url, attachment_type, attachment_name
        FROM messages
        WHERE conversation_id = ${id}
        ORDER BY created_at ASC`;

  // Mark incoming messages read (only if there could be unread ones — i.e. a full or fresh fetch).
  if (messages.length > 0) {
    await sql`
      UPDATE messages SET read_at = now()
      WHERE conversation_id = ${id} AND sender_id <> ${auth.sub} AND read_at IS NULL
    `;
  }

  // Hide contact details from the RECIPIENT until these two have actually booked.
  //
  // Masking happens here, on read, never on write: the stored row keeps the original wording
  // so a dispute or moderation review can still see what was really said.
  //
  // Only the other party's messages are masked — showing someone their own sentence back with
  // holes in it just reads as a bug, and the composer already warned them before they sent it.
  //
  // It lifts once a booking exists between the pair, because at that point the booking page
  // hands them each other's phone number anyway (see /api/bookings/:id) — continuing to mask
  // here would be theatre, and would break legitimate "I'm outside, ring me" messages.
  const booked = await partiesHaveBooking(id);
  const shaped = messages.map((m) => {
    const mine = m.sender_id === auth.sub;
    const body = m.body as string | null;
    if (booked || mine || !body) return m;
    const cleaned = maskContactInfo(body);
    return { ...m, body: cleaned, masked: cleaned !== body };
  });

  return json({ messages: shaped, contact_masking: !booked });
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

  let body: {
    body?: string;
    attachment_url?: string;
    attachment_type?: string;
    attachment_name?: string;
  };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }

  // An attachment-only message is allowed; body is NOT NULL so it falls back to ''.
  const text = body.body?.trim() ?? "";
  const attachmentUrl = body.attachment_url?.trim() || null;
  if (!text && !attachmentUrl) return error("Message body or attachment is required");
  // Only URLs we minted for our own R2 bucket may be stored — never arbitrary links.
  if (attachmentUrl && !isOurUploadUrl(attachmentUrl)) return error("Invalid attachment URL");
  const attachmentType = attachmentUrl ? body.attachment_type?.trim() || null : null;
  const attachmentName = attachmentUrl ? body.attachment_name?.trim().slice(0, 200) || null : null;

  const flagged = text ? hasContactInfo(text) : false; // off-platform contact attempt — flag for review
  const rows = await sql`
    INSERT INTO messages (
      conversation_id, sender_id, body, flagged,
      attachment_url, attachment_type, attachment_name
    )
    VALUES (
      ${id}, ${auth.sub}, ${text}, ${flagged},
      ${attachmentUrl}, ${attachmentType}, ${attachmentName}
    )
    RETURNING id, sender_id, body, read_at, created_at, flagged,
              attachment_url, attachment_type, attachment_name
  `;

  if (recipient) {
    const preview = text ? text.slice(0, 120) : attachmentName || "Sent an attachment";
    await notify(recipient, "messages", auth.name || "New message", preview, {
      entity: "chat",
      id,
    });
  }
  return json({ message: rows[0] }, { status: 201 });
});
