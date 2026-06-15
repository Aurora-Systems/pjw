import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";
import { deleteObject, keyFromPublicUrl } from "@/lib/r2";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** DELETE /api/provider/portfolio/:id — remove a portfolio item (and its R2 object). */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "provider") return error("Providers only", 403);
  const { id } = await params;
  const rows = await sql`
    DELETE FROM provider_portfolio WHERE id = ${id} AND provider_id = ${auth.sub} RETURNING url
  `;
  const key = keyFromPublicUrl(rows[0]?.url as string | undefined);
  if (key) {
    // Best-effort: don't fail the request if the object is already gone.
    await deleteObject(key).catch(() => undefined);
  }
  return json({ ok: true });
}
