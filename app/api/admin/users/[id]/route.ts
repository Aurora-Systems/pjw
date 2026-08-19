import type { NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";
import { parseBody } from "@/lib/validate";
import { logAdminAction } from "@/lib/admin-audit";
import { notify } from "@/lib/notify";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

const bodySchema = z.object({
  id_verified: z.boolean().optional(),
  role: z.enum(["customer", "provider", "corporate", "admin"]).optional(),
  reason: z.string().trim().max(500).optional(),
});

/**
 * PATCH /api/admin/users/:id — grant/revoke the work gate, or change a user's role.
 *
 * `id_verified` IS NOT THE PUBLIC "VERIFIED" BADGE. Read this before changing anything here:
 *   - users.id_verified   = permission to work. Gates canTakeWork() and POST /jobs/:id/bids.
 *                           An admin can grant it with no KYC at all — that is the point of it.
 *   - users.didit_status  = the KYC result, and the ONLY source of the public Verified badge
 *                           (DIDIT_VERIFIED_SQL in lib/didit.ts). This route never touches it.
 * Conflating the two once put a Verified badge on 22 providers who never completed Didit.
 *
 * Both fields are optional; send either or both. Returns the updated user.
 */
export const PATCH = safe(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const admin = await requireRole(req, "admin");
  const { id } = await params;
  const body = await parseBody(req, bodySchema);

  if (body.id_verified === undefined && body.role === undefined) {
    return error("Nothing to change — send id_verified and/or role.");
  }

  // Self-protection: an admin must not be able to lock themselves out of the console, nor
  // quietly strip their own work gate. Same spirit as the self-ban guard on ./ban.
  if (id === admin.sub) {
    if (body.id_verified === false) return error("You cannot remove your own verification", 400);
    if (body.role && body.role !== "admin") return error("You cannot change your own role", 400);
  }

  const before = await sql`
    SELECT id, role, id_verified, verification_status FROM users WHERE id = ${id}
  `;
  if (before.length === 0) return error("User not found", 404);
  const prev = before[0];

  const nextVerified = body.id_verified ?? Boolean(prev.id_verified);
  const nextRole = body.role ?? String(prev.role);

  // verification_status is the queue's own state (GET /api/admin/verifications lists
  // 'unverified'/'pending'). Granting the gate closes the ticket; revoking it puts the user
  // BACK in the queue rather than marking them 'rejected', because a revoked gate normally
  // means "needs another look", not "refused forever".
  const nextStatus =
    body.id_verified === undefined
      ? String(prev.verification_status)
      : body.id_verified
        ? "verified"
        : "unverified";

  const updated = await sql`
    UPDATE users
    SET id_verified = ${nextVerified}, verification_status = ${nextStatus}, role = ${nextRole}
    WHERE id = ${id}
    RETURNING id, full_name, email, phone, role, avatar_url, city, created_at,
              id_verified, didit_status, verification_status,
              (deleted_at IS NOT NULL) AS banned
  `;
  const user = updated[0];

  // A user promoted to provider needs the profile row that every provider query joins to
  // (wallet balance, onboarding, bids). Without it they are a provider that no provider
  // endpoint can see.
  if (nextRole === "provider" && prev.role !== "provider") {
    await sql`INSERT INTO provider_profiles (user_id) VALUES (${id}) ON CONFLICT DO NOTHING`;
  }

  // No token_version bump needed: getAuth() re-reads the role from the DB on every request,
  // so a role change takes effect on the user's very next call without logging them out.

  if (body.id_verified !== undefined && body.id_verified !== prev.id_verified) {
    await logAdminAction({
      admin_id: admin.sub,
      action: body.id_verified ? "user.verify" : "user.unverify",
      target_type: "user",
      target_id: id,
      detail: { from: prev.id_verified, to: body.id_verified, verification_status: nextStatus },
      reason: body.reason ?? null,
    });
    await notify(
      id,
      "system",
      body.id_verified ? "You're approved to work" : "Approval removed",
      body.id_verified
        ? "Your account has been approved. You can start taking jobs."
        : "Your approval to take jobs has been removed. Contact support if you think this is a mistake."
    );
  }

  if (body.role && body.role !== prev.role) {
    await logAdminAction({
      admin_id: admin.sub,
      action: "user.role",
      target_type: "user",
      target_id: id,
      detail: { from: prev.role, to: body.role },
      reason: body.reason ?? null,
    });
  }

  return json({ user });
});
