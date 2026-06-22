import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, preflight, safe } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** DELETE /api/favorites/:id — unsave a provider. */
export const DELETE = safe(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireAuth(req);
  const { id } = await params;
  await sql`DELETE FROM favorites WHERE user_id = ${auth.sub} AND provider_id = ${id}`;
  return json({ ok: true, favorited: false });
});
