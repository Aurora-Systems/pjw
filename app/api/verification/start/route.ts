import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, publicBaseUrl } from "@/lib/http";
import { createSession, isDiditConfigured } from "@/lib/didit";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** POST /api/verification/start — begin a Didit identity check; returns the hosted URL to open. */
export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (!isDiditConfigured()) {
    return error("Identity verification is not configured yet (missing Didit keys).", 503);
  }

  const base = publicBaseUrl(req);
  let session;
  try {
    session = await createSession({
      vendorData: auth.sub,
      callback: `${base}/verify/return`,
    });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Could not start verification", 502);
  }

  await sql`
    UPDATE users SET didit_session_id = ${session.session_id}, verification_status = 'pending'
    WHERE id = ${auth.sub}
  `;
  return json({ url: session.url, session_id: session.session_id });
}
