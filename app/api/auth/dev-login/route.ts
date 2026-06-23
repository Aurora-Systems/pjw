import type { NextRequest } from "next/server";
import { resolveLocalUser, getSessionUser, type AccountType } from "@/lib/users";
import { signToken, type UserRole } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * POST /api/auth/dev-login — DEV ONLY. Mints an app session without an emailed
 * OTP so the app can be exercised/tested without a real inbox. Gated by
 * ALLOW_DEV_LOGIN. Never enable in production.
 */
export const POST = safe(async (req: NextRequest) => {
  if (process.env.ALLOW_DEV_LOGIN !== "true") {
    return error("Not found", 404);
  }

  let body: { email?: string; role?: UserRole; full_name?: string; account_type?: AccountType };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  const email = body.email?.trim().toLowerCase();
  if (!email) return error("email is required");

  // Dev-login must never mint an admin session, even when ALLOW_DEV_LOGIN is on.
  const allowedRoles: UserRole[] = ["customer", "provider", "corporate"];
  const role = allowedRoles.includes(body.role as UserRole)
    ? (body.role as UserRole)
    : "customer";
  const accountType: AccountType | undefined =
    body.account_type === "individual" || body.account_type === "company"
      ? body.account_type
      : undefined;

  // Use a stable synthetic auth id so repeated dev logins resolve to one user.
  const authId = `dev:${email}`;
  const user = await resolveLocalUser(authId, email, body.full_name, role, accountType, true);
  if (!user) return error("Could not create dev user", 500);
  const token = await signToken({ sub: user.id, role: user.role, name: user.full_name });
  return json({ token, user: (await getSessionUser(user.id)) ?? user });
});
