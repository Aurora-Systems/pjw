import type { NextRequest } from "next/server";
import { verifySignInOtp } from "@/lib/neonauth";
import { resolveLocalUser, getSessionUser, type AccountType } from "@/lib/users";
import { signToken, type UserRole } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { track } from "@/lib/analytics";
import { isReviewAccount, reviewCode } from "@/lib/review";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * POST /api/auth/otp/verify — verify the OTP with Neon Auth, map to a local
 * user (creating with the chosen role on first sign-in), and return our app JWT.
 */
export const POST = safe(async (req: NextRequest) => {
  let body: {
    email?: string;
    otp?: string;
    role?: UserRole;
    full_name?: string;
    account_type?: AccountType;
    signup?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }

  const email = body.email?.trim().toLowerCase();
  const otp = body.otp?.trim();
  if (!email || !otp) return error("email and otp are required");

  // App-store review account: accept the fixed code (no Neon Auth round-trip, since the
  // reviewer never received an email). Resolves/creates a single demo customer account.
  if (isReviewAccount(email)) {
    if (otp !== reviewCode()) return error("Invalid or expired code", 401);
    const rvUser = await resolveLocalUser("apple-review", email, "App Review", "customer", null, true);
    if (!rvUser) return error("Could not sign in the review account", 500);
    const rvToken = await signToken({ sub: rvUser.id, role: rvUser.role, name: rvUser.full_name });
    return json({ token: rvToken, user: (await getSessionUser(rvUser.id)) ?? rvUser });
  }

  // Sign-up must collect a name (proper onboarding); sign-in must not create accounts.
  const signup = body.signup === true;
  if (signup && !body.full_name?.trim()) {
    return error("Please enter your name to create an account");
  }

  // Throttle verification attempts to stop 6-digit brute force: per-IP and per-email.
  await rateLimit(`otp-vrf:ip:${clientIp(req)}`, 30, 600);
  await rateLimit(`otp-vrf:email:${email}`, 10, 600);

  const authUser = await verifySignInOtp(email, otp);
  if (!authUser) return error("Invalid or expired code", 401);

  const allowedRoles: UserRole[] = ["customer", "provider", "corporate"];
  const role = allowedRoles.includes(body.role as UserRole)
    ? (body.role as UserRole)
    : "customer";
  const accountType: AccountType | undefined =
    body.account_type === "individual" || body.account_type === "company"
      ? body.account_type
      : undefined;

  const user = await resolveLocalUser(
    authUser.id,
    authUser.email,
    body.full_name || authUser.name,
    role,
    accountType,
    signup // only provision a new local user on explicit sign-up
  );
  if (!user) {
    return error("No account found for this email. Please create an account.", 404);
  }
  const token = await signToken({ sub: user.id, role: user.role, name: user.full_name });
  track(user.id, signup ? "signup_completed" : "login", { role: user.role });
  // Return the FULL user (incl. provider_onboarded) so the client routes correctly on sign-in.
  return json({ token, user: (await getSessionUser(user.id)) ?? user });
});
