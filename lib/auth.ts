import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-pocketjobs-secret-change-me-in-production"
);

export type UserRole = "customer" | "provider" | "corporate" | "admin";

export interface AuthPayload {
  sub: string; // user id
  role: UserRole;
  name: string;
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function signToken(payload: AuthPayload): Promise<string> {
  return new SignJWT({ role: payload.role, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

/** Verify a raw JWT string. Returns the payload or null. */
export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      sub: String(payload.sub),
      role: payload.role as UserRole,
      name: String(payload.name ?? ""),
    };
  } catch {
    return null;
  }
}

/** Extract and verify the bearer token from an incoming request. */
export async function getAuth(req: NextRequest): Promise<AuthPayload | null> {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  return verifyToken(token);
}
