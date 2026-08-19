import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { json, preflight, safe } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * GET /api/admin/audit — the admin action trail, newest first. Optional `limit`
 * (default 100, max 500).
 *
 * Every state-changing admin route appends here (see lib/admin-audit.ts). The join to
 * `users` is a LEFT join on purpose: admin_actions.admin_id is ON DELETE SET NULL, and an
 * action whose author has since been removed must still show up — losing the row would
 * defeat the whole point of keeping it.
 */
export const GET = safe(async (req: NextRequest) => {
  await requireRole(req, "admin");

  const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get("limit")) || 100, 1), 500);

  const actions = await sql`
    SELECT a.id, a.admin_id, u.full_name AS admin_name, a.action, a.target_type, a.target_id,
           a.detail, a.reason, a.created_at
    FROM admin_actions a
    LEFT JOIN users u ON u.id = a.admin_id
    ORDER BY a.created_at DESC
    LIMIT ${limit}
  `;
  return json({ actions });
});
