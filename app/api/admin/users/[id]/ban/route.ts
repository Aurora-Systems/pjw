import type { NextRequest } from "next/server";
import { requireRole, banUser } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * POST /api/admin/users/:id/ban — admin bans (ban:true) or reinstates (ban:false) a user.
 * Either way bumps token_version, so all of the user's existing sessions are revoked.
 */
export const POST = safe(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const admin = await requireRole(req, "admin");
  const { id } = await params;
  if (id === admin.sub) return error("You cannot ban yourself", 400);

  let body: { ban?: boolean };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  const ban = body.ban !== false; // default to banning
  await banUser(id, ban);
  return json({ ok: true, banned: ban });
});
