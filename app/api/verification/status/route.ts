import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";
import { getDecision, mapDiditStatus } from "@/lib/didit";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** GET /api/verification/status — current status; refreshes from Didit if a session exists. */
export const GET = safe(async (req: NextRequest) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);

  const rows = await sql`
    SELECT verification_status, id_verified, didit_session_id FROM users WHERE id = ${auth.sub}
  `;
  if (rows.length === 0) return error("User not found", 404);
  let { verification_status, id_verified } = rows[0];
  const sessionId = rows[0].didit_session_id as string | null;

  if (sessionId && verification_status !== "verified") {
    const d = await getDecision(sessionId).catch(() => null);
    if (d) {
      const mapped = mapDiditStatus(d.status);
      verification_status = mapped.verification_status;
      id_verified = mapped.id_verified;
      await sql`
        UPDATE users SET verification_status = ${verification_status}, id_verified = ${id_verified},
          didit_decision = ${JSON.stringify(d.decision)}::jsonb
        WHERE id = ${auth.sub}
      `;
    }
  }
  return json({ verification_status, id_verified });
});
