import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** GET /api/conversations — the user's conversations with last message + counterparty. */
export const GET = safe(async (req: NextRequest) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);

  const text = `
    SELECT c.id, c.job_id, c.created_at,
           CASE WHEN c.customer_id = $1 THEN pr.full_name ELSE cu.full_name END AS counterparty_name,
           CASE WHEN c.customer_id = $1 THEN pr.avatar_url ELSE cu.avatar_url END AS counterparty_avatar_url,
           CASE WHEN c.customer_id = $1 THEN c.provider_id ELSE c.customer_id END AS counterparty_id,
           m.body AS last_message, m.created_at AS last_at
    FROM conversations c
    JOIN users cu ON cu.id = c.customer_id
    JOIN users pr ON pr.id = c.provider_id
    LEFT JOIN LATERAL (
      SELECT body, created_at FROM messages WHERE conversation_id = c.id
      ORDER BY created_at DESC LIMIT 1
    ) m ON true
    WHERE c.customer_id = $1 OR c.provider_id = $1
    ORDER BY COALESCE(m.created_at, c.created_at) DESC
    LIMIT $2 OFFSET $3
  `;
  const p = req.nextUrl.searchParams;
  const limit = Math.min(Math.max(Number(p.get("limit")) || 100, 1), 200);
  const offset = Math.max(Number(p.get("offset")) || 0, 0);
  const conversations = await sql.query(text, [auth.sub, limit, offset]);
  return json({ conversations });
});

/**
 * POST /api/conversations — find or create a conversation with another user.
 * Body: { counterparty_id, job_id? }. The signed-in user's role decides which
 * side of the conversation they sit on.
 */
export const POST = safe(async (req: NextRequest) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);

  let body: { counterparty_id?: string; job_id?: string };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  if (!body.counterparty_id) return error("counterparty_id is required");

  const customerId = auth.role === "provider" ? body.counterparty_id : auth.sub;
  const providerId = auth.role === "provider" ? auth.sub : body.counterparty_id;
  const jobId = body.job_id ?? null;

  // Respect blocks in either direction.
  const blocked = await sql`
    SELECT 1 FROM user_blocks
    WHERE (blocker_id = ${auth.sub} AND blocked_id = ${body.counterparty_id})
       OR (blocker_id = ${body.counterparty_id} AND blocked_id = ${auth.sub})
    LIMIT 1
  `;
  if (blocked.length > 0) return error("You can't message this user.", 403);

  // Find-or-create (NULL job_id is distinct under the unique index, so dedupe manually).
  const existing = await sql`
    SELECT * FROM conversations
    WHERE customer_id = ${customerId} AND provider_id = ${providerId}
      AND job_id IS NOT DISTINCT FROM ${jobId}
    LIMIT 1
  `;
  if (existing.length > 0) return json({ conversation: existing[0] });

  // Anti-harassment: you can only START a conversation with someone you have a real
  // relationship with (a booking together, or a bid on the other's job). No cold DMs.
  const related = await sql`
    SELECT 1 WHERE
      EXISTS (SELECT 1 FROM bookings WHERE customer_id = ${customerId} AND provider_id = ${providerId})
      OR EXISTS (
        SELECT 1 FROM bids b JOIN jobs j ON j.id = b.job_id
        WHERE j.customer_id = ${customerId} AND b.provider_id = ${providerId}
      )
  `;
  if (related.length === 0) {
    return error("You can only message someone you've booked or bid with.", 403);
  }

  const rows = await sql`
    INSERT INTO conversations (customer_id, provider_id, job_id)
    VALUES (${customerId}, ${providerId}, ${jobId})
    RETURNING *
  `;
  return json({ conversation: rows[0] }, { status: 201 });
});
