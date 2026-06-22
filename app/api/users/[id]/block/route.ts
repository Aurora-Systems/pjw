import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** POST /api/users/:id/block — block another user. */
export const POST = safe(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireAuth(req);
  const { id } = await params;
  if (id === auth.sub) return error("You can't block yourself", 400);
  await sql`
    INSERT INTO user_blocks (blocker_id, blocked_id) VALUES (${auth.sub}, ${id})
    ON CONFLICT DO NOTHING
  `;
  return json({ ok: true, blocked: true });
});

/** DELETE /api/users/:id/block — unblock. */
export const DELETE = safe(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireAuth(req);
  const { id } = await params;
  await sql`DELETE FROM user_blocks WHERE blocker_id = ${auth.sub} AND blocked_id = ${id}`;
  return json({ ok: true, blocked: false });
});
