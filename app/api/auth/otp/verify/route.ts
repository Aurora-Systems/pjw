import type { NextRequest } from "next/server";
import { verifySignInOtp } from "@/lib/neonauth";
import { resolveLocalUser } from "@/lib/users";
import { signToken, type UserRole } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * POST /api/auth/otp/verify — verify the OTP with Neon Auth, map to a local
 * user (creating with the chosen role on first sign-in), and return our app JWT.
 */
export async function POST(req: NextRequest) {
  let body: { email?: string; otp?: string; role?: UserRole; full_name?: string };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }

  const email = body.email?.trim().toLowerCase();
  const otp = body.otp?.trim();
  if (!email || !otp) return error("email and otp are required");

  const authUser = await verifySignInOtp(email, otp);
  if (!authUser) return error("Invalid or expired code", 401);

  const allowedRoles: UserRole[] = ["customer", "provider", "corporate"];
  const role = allowedRoles.includes(body.role as UserRole)
    ? (body.role as UserRole)
    : "customer";

  const user = await resolveLocalUser(authUser.id, authUser.email, body.full_name || authUser.name, role);
  const token = await signToken({ sub: user.id, role: user.role, name: user.full_name });
  return json({ token, user });
}
