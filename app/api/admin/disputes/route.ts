import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** GET /api/admin/disputes — open + recent disputes. */
export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "admin") return error("Admins only", 403);

  const disputes = await sql`
    SELECT id, reason, amount, category, status, created_at
    FROM disputes ORDER BY (status = 'open') DESC, created_at DESC LIMIT 50
  `;
  return json({ disputes });
}

/** PATCH /api/admin/disputes — resolve a dispute. */
export async function PATCH(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "admin") return error("Admins only", 403);

  let body: { id?: string; status?: "open" | "resolved" };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  if (!body.id) return error("id is required");

  const rows = await sql`
    UPDATE disputes SET status = ${body.status ?? "resolved"} WHERE id = ${body.id} RETURNING *
  `;
  if (rows.length === 0) return error("Dispute not found", 404);
  return json({ dispute: rows[0] });
}
