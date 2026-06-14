import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** DELETE /api/provider/portfolio/:id — remove a portfolio item (and its upload). */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "provider") return error("Providers only", 403);
  const { id } = await params;
  const rows = await sql`
    DELETE FROM provider_portfolio WHERE id = ${id} AND provider_id = ${auth.sub} RETURNING upload_id
  `;
  if (rows[0]?.upload_id) {
    await sql`DELETE FROM uploads WHERE id = ${rows[0].upload_id} AND owner_id = ${auth.sub}`;
  }
  return json({ ok: true });
}
