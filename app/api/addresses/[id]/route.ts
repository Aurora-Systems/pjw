import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** DELETE /api/addresses/:id — remove a saved address. */
export const DELETE = safe(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  const { id } = await params;
  await sql`DELETE FROM saved_addresses WHERE id = ${id} AND user_id = ${auth.sub}`;
  return json({ ok: true });
});
