import crypto from "crypto";

/**
 * Didit identity verification (https://didit.me).
 * - Base: https://verification.didit.me/v3/
 * - Auth: header `x-api-key: <DIDIT_API_KEY>`
 * - Create session: POST /v3/session/ { workflow_id, vendor_data, callback } -> { session_id, url }
 * - Decision: GET /v3/session/{session_id}/decision/
 * Results arrive via webhook; we re-fetch the decision server-side for authority.
 */

const BASE = "https://verification.didit.me/v3";

export function isDiditConfigured(): boolean {
  return Boolean(process.env.DIDIT_API_KEY && process.env.DIDIT_WORKFLOW_ID);
}

function apiKey(): string {
  const k = process.env.DIDIT_API_KEY;
  if (!k) throw new Error("DIDIT_API_KEY is not set");
  return k;
}

export interface DiditSession {
  session_id: string;
  url: string;
  status?: string;
}

export async function createSession(input: {
  vendorData: string;
  callback?: string;
}): Promise<DiditSession> {
  const res = await fetch(`${BASE}/session/`, {
    method: "POST",
    headers: { "x-api-key": apiKey(), "content-type": "application/json" },
    body: JSON.stringify({
      workflow_id: process.env.DIDIT_WORKFLOW_ID,
      vendor_data: input.vendorData,
      callback: input.callback,
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.url) {
    throw new Error(data?.message || `Didit create-session failed (${res.status})`);
  }
  return { session_id: data.session_id, url: data.url, status: data.status };
}

export async function getDecision(sessionId: string): Promise<{ status: string; decision: unknown } | null> {
  const res = await fetch(`${BASE}/session/${sessionId}/decision/`, {
    headers: { "x-api-key": apiKey() },
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  if (!data) return null;
  return { status: data.status, decision: data };
}

/** Best-effort webhook signature check (HMAC-SHA256 of the raw body). */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.DIDIT_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const hmac = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
  } catch {
    return false;
  }
}

/** Map a Didit status to our local verification_status. */
export function mapDiditStatus(status: string): {
  verification_status: "pending" | "verified" | "rejected";
  id_verified: boolean;
} {
  const s = (status || "").toLowerCase();
  if (s === "approved") return { verification_status: "verified", id_verified: true };
  if (["declined", "expired", "kyc expired", "abandoned"].includes(s))
    return { verification_status: "rejected", id_verified: false };
  return { verification_status: "pending", id_verified: false };
}

/**
 * SQL predicate for the public "Verified" badge: the provider actually completed Didit
 * KYC and Didit APPROVED them. Expects the users table aliased as `u`. It is a constant,
 * not user input, so it is safe to interpolate.
 *
 * Do NOT use `users.id_verified` for the badge. That column is the *permission to work*
 * gate (lib/wallet.ts canTakeWork + POST /jobs/:id/bids), and an admin can set it from the
 * moderation queue to let someone bid without any KYC. Conflating the two is exactly how
 * 22 providers ended up wearing a Verified badge without ever completing Didit.
 */
export const DIDIT_VERIFIED_SQL = `(u.didit_status ILIKE 'approved')`;
