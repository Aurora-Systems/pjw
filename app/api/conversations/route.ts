import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** GET /api/conversations — the user's conversations with last message + counterparty. */
export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);

  const text = `
    SELECT c.id, c.job_id, c.created_at,
           CASE WHEN c.customer_id = $1 THEN pr.full_name ELSE cu.full_name END AS counterparty_name,
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
  `;
  const conversations = await sql.query(text, [auth.sub]);
  return json({ conversations });
}

/**
 * POST /api/conversations — find or create a conversation with another user.
 * Body: { counterparty_id, job_id? }. The signed-in user's role decides which
 * side of the conversation they sit on.
 */
export async function POST(req: NextRequest) {
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

  const rows = await sql`
    INSERT INTO conversations (customer_id, provider_id, job_id)
    VALUES (${customerId}, ${providerId}, ${body.job_id ?? null})
    ON CONFLICT (customer_id, provider_id, job_id) DO UPDATE SET customer_id = EXCLUDED.customer_id
    RETURNING *
  `;
  return json({ conversation: rows[0] }, { status: 201 });
}
