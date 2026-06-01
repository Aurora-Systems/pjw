import type { NextRequest } from "next/server";
import { resolveLocalUser } from "@/lib/users";
import { signToken, type UserRole } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * POST /api/auth/dev-login — DEV ONLY. Mints an app session without an emailed
 * OTP so the app can be exercised/tested without a real inbox. Gated by
 * ALLOW_DEV_LOGIN. Never enable in production.
 */
export async function POST(req: NextRequest) {
  if (process.env.ALLOW_DEV_LOGIN !== "true") {
    return error("Not found", 404);
  }

  let body: { email?: string; role?: UserRole; full_name?: string };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  const email = body.email?.trim().toLowerCase();
  if (!email) return error("email is required");

  const allowedRoles: UserRole[] = ["customer", "provider", "corporate", "admin"];
  const role = allowedRoles.includes(body.role as UserRole)
    ? (body.role as UserRole)
    : "customer";

  // Use a stable synthetic auth id so repeated dev logins resolve to one user.
  const authId = `dev:${email}`;
  const user = await resolveLocalUser(authId, email, body.full_name, role);
  const token = await signToken({ sub: user.id, role: user.role, name: user.full_name });
  return json({ token, user });
}
