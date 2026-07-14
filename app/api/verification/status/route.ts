import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";
import { getDecision, mapDiditStatus } from "@/lib/didit";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * GET /api/verification/status — the caller's own KYC state; refreshes from Didit if a session exists.
 *
 * Returns `didit_verified` (Didit actually approved them) alongside the legacy fields. The profile
 * page drives its "Verify identity" card off THAT, not off id_verified: an admin approval sets
 * id_verified/verification_status without any KYC, which used to make the card read "verified" and
 * hide the button — leaving that provider permanently unable to start Didit or earn the badge.
 */
export const GET = safe(async (req: NextRequest) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);

  const rows = await sql`
    SELECT verification_status, id_verified, didit_session_id, didit_status
    FROM users WHERE id = ${auth.sub}
  `;
  if (rows.length === 0) return error("User not found", 404);
  let { verification_status, id_verified } = rows[0];
  let diditStatus = rows[0].didit_status as string | null;
  const sessionId = rows[0].didit_session_id as string | null;

  // Re-poll while not yet verified. (Starting a Didit run sets verification_status='pending' — see
  // verification/start — so an admin-approved provider who begins KYC does get polled from then on.)
  // Deliberately unchanged: this is also the code path that can flip id_verified, and id_verified is
  // the permission-to-work gate. Do not widen it without deciding what a Didit decline should do to
  // a provider who is currently allowed to work.
  if (sessionId && verification_status !== "verified") {
    const d = await getDecision(sessionId).catch(() => null);
    if (d) {
      const mapped = mapDiditStatus(d.status);
      verification_status = mapped.verification_status;
      id_verified = mapped.id_verified;
      diditStatus = d.status ?? null;
      await sql`
        UPDATE users SET verification_status = ${verification_status}, id_verified = ${id_verified},
          didit_status = ${diditStatus},
          didit_decision = ${JSON.stringify(d.decision)}::jsonb
        WHERE id = ${auth.sub}
      `;
    }
  }

  return json({
    verification_status,
    id_verified,
    didit_status: diditStatus,
    didit_verified: /^approved$/i.test(diditStatus ?? ""),
  });
});
