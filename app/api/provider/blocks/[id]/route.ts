import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** DELETE /api/provider/blocks/:id — unblock a time range. */
export const DELETE = safe(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "provider") return error("Providers only", 403);
  const { id } = await params;
  await sql`DELETE FROM provider_blocks WHERE id = ${id} AND provider_id = ${auth.sub}`;
  return json({ ok: true });
});
