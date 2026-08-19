import type { NextRequest } from "next/server";
import { requireRole, banUser } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";
import { logAdminAction } from "@/lib/admin-audit";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * POST /api/admin/users/:id/ban — admin bans (ban:true) or reinstates (ban:false) a user.
 * Either way bumps token_version, so all of the user's existing sessions are revoked.
 *
 * A ban is a soft delete (users.deleted_at), which is what every "banned" flag in the admin
 * console reads. An optional `reason` is recorded on the audit trail, not on the user row.
 */
export const POST = safe(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const admin = await requireRole(req, "admin");
  const { id } = await params;
  if (id === admin.sub) return error("You cannot ban yourself", 400);

  let body: { ban?: boolean; reason?: string };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  const ban = body.ban !== false; // default to banning
  await banUser(id, ban);

  // Logged after the fact: revoking someone's access is exactly the kind of action that has
  // to be attributable to a named admin later.
  await logAdminAction({
    admin_id: admin.sub,
    action: ban ? "user.ban" : "user.unban",
    target_type: "user",
    target_id: id,
    detail: { banned: ban },
    reason: typeof body.reason === "string" ? body.reason.trim().slice(0, 500) || null : null,
  });

  return json({ ok: true, banned: ban });
});
