import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { HttpError } from "@/lib/http";

const rawSecret = process.env.JWT_SECRET;
if (!rawSecret) {
  throw new Error("JWT_SECRET is not set");
}
const secret = new TextEncoder().encode(rawSecret);

export type UserRole = "customer" | "provider" | "corporate" | "admin";

export interface AuthPayload {
  sub: string; // user id
  role: UserRole;
  name: string;
}

/**
 * Mint an app session JWT. The token embeds the user's current `token_version`; bumping
 * that column (see banUser / revoke-all) invalidates every previously issued token.
 */
export async function signToken(payload: AuthPayload): Promise<string> {
  const rows = await sql`SELECT token_version FROM users WHERE id = ${payload.sub}`;
  const ver = rows.length ? Number(rows[0].token_version ?? 0) : 0;
  return new SignJWT({ role: payload.role, name: payload.name, ver })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export type AuthError = "missing" | "expired" | "invalid" | "revoked" | "banned";

/**
 * Verify the bearer token AND re-check the user against the DB so we can:
 *  - revoke sessions (token_version bump) — e.g. on ban or "log out everywhere",
 *  - block soft-deleted/banned users (deleted_at),
 *  - serve the authoritative role (so a role switch takes effect immediately).
 * Returns the payload, or null with the reason in `outReason` (for callers that care).
 */
export async function getAuth(
  req: NextRequest,
  outReason?: { reason?: AuthError }
): Promise<AuthPayload | null> {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    if (outReason) outReason.reason = "missing";
    return null;
  }

  let claims;
  try {
    const { payload } = await jwtVerify(token, secret);
    claims = payload;
  } catch (e) {
    const expired = !!e && typeof e === "object" && (e as { code?: string }).code === "ERR_JWT_EXPIRED";
    if (outReason) outReason.reason = expired ? "expired" : "invalid";
    return null;
  }

  const rows = await sql`
    SELECT role, full_name, token_version, deleted_at
    FROM users WHERE id = ${String(claims.sub)}
  `;
  if (rows.length === 0 || rows[0].deleted_at) {
    if (outReason) outReason.reason = "banned";
    return null;
  }
  const tokenVer = Number((claims as { ver?: number }).ver ?? 0);
  if (tokenVer !== Number(rows[0].token_version ?? 0)) {
    if (outReason) outReason.reason = "revoked";
    return null;
  }

  return {
    sub: String(claims.sub),
    role: rows[0].role as UserRole,
    name: String(rows[0].full_name ?? claims.name ?? ""),
  };
}

/** Like getAuth but throws a 401 HttpError (caught by safe()) instead of returning null. */
export async function requireAuth(req: NextRequest): Promise<AuthPayload> {
  const reason: { reason?: AuthError } = {};
  const auth = await getAuth(req, reason);
  if (!auth) {
    throw new HttpError(
      reason.reason === "expired" ? "Your session has expired. Please sign in again." : "Unauthorized",
      401
    );
  }
  return auth;
}

/** Require an authenticated user with one of the given roles, else throw 401/403. */
export async function requireRole(req: NextRequest, ...roles: UserRole[]): Promise<AuthPayload> {
  const auth = await requireAuth(req);
  if (!roles.includes(auth.role)) throw new HttpError("Forbidden", 403);
  return auth;
}

/** Revoke all of a user's sessions, and optionally ban (soft-delete) the user. */
export async function banUser(userId: string, ban: boolean): Promise<void> {
  if (ban) {
    await sql`UPDATE users SET token_version = token_version + 1, deleted_at = now() WHERE id = ${userId}`;
  } else {
    await sql`UPDATE users SET token_version = token_version + 1, deleted_at = NULL WHERE id = ${userId}`;
  }
}
