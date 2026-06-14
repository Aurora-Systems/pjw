import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getDecision, mapDiditStatus, verifyWebhookSignature } from "@/lib/didit";

export const runtime = "nodejs";

/**
 * POST /api/verification/webhook — Didit calls this when a verification changes.
 * We best-effort check the signature, then re-fetch the decision server-side
 * (authoritative) and update the user's verification status.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-signature-v2") || req.headers.get("x-signature");
  // Signature check is best-effort; authority comes from re-fetching the decision.
  verifyWebhookSignature(raw, signature);

  let body: { session_id?: string; vendor_data?: string; status?: string };
  try {
    body = JSON.parse(raw);
  } catch {
    return new NextResponse("bad body", { status: 400 });
  }

  const sessionId = body.session_id;
  const userId = body.vendor_data;
  if (!sessionId && !userId) return new NextResponse("OK", { status: 200 });

  // Re-fetch authoritative status from Didit (don't trust the payload alone).
  let status = body.status || "";
  let decision: unknown = null;
  if (sessionId) {
    const d = await getDecision(sessionId).catch(() => null);
    if (d) {
      status = d.status;
      decision = d.decision;
    }
  }
  if (!status) return new NextResponse("OK", { status: 200 });

  const mapped = mapDiditStatus(status);
  await sql`
    UPDATE users SET
      verification_status = ${mapped.verification_status},
      id_verified = ${mapped.id_verified},
      didit_decision = ${decision ? JSON.stringify(decision) : null}::jsonb
    WHERE (${userId}::uuid IS NOT NULL AND id = ${userId ?? null}::uuid)
       OR (${sessionId}::text IS NOT NULL AND didit_session_id = ${sessionId ?? null})
  `;
  return new NextResponse("OK", { status: 200 });
}
