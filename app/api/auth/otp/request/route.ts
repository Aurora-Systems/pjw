import type { NextRequest } from "next/server";
import { sendSignInOtp } from "@/lib/neonauth";
import { json, error, preflight } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** POST /api/auth/otp/request — send a passwordless email OTP via Neon Auth. */
export async function POST(req: NextRequest) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  const email = body.email?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return error("A valid email is required");
  }

  try {
    await sendSignInOtp(email);
  } catch {
    return error("Could not send the verification code. Try again.", 502);
  }
  return json({ ok: true });
}
