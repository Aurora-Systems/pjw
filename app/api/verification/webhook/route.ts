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
  // The webhook is unauthenticated, so the signature is the ONLY proof it's from Didit.
  // Reject anything that doesn't verify — never trust the body otherwise.
  if (!verifyWebhookSignature(raw, signature)) {
    return new NextResponse("invalid signature", { status: 401 });
  }

  let body: { session_id?: string };
  try {
    body = JSON.parse(raw);
  } catch {
    return new NextResponse("bad body", { status: 400 });
  }

  // Act ONLY on the session_id (which we created and stored as didit_session_id) and ONLY
  // on the authoritative decision re-fetched from Didit. We never trust a client-supplied
  // status or vendor_data — that would let anyone forge id_verified for any user.
  const sessionId = body.session_id;
  if (!sessionId) return new NextResponse("OK", { status: 200 });

  const d = await getDecision(sessionId).catch(() => null);
  if (!d) return new NextResponse("OK", { status: 200 });

  const mapped = mapDiditStatus(d.status);
  await sql`
    UPDATE users SET
      verification_status = ${mapped.verification_status},
      id_verified = ${mapped.id_verified},
      didit_status = ${d.status ?? null},
      didit_decision = ${d.decision ? JSON.stringify(d.decision) : null}::jsonb
    WHERE didit_session_id = ${sessionId}
  `;
  return new NextResponse("OK", { status: 200 });
}
