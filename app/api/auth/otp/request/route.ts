import type { NextRequest } from "next/server";
import { sendSignInOtp } from "@/lib/neonauth";
import { json, error, preflight, safe } from "@/lib/http";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** POST /api/auth/otp/request — send a passwordless email OTP via Neon Auth. */
export const POST = safe(async (req: NextRequest) => {
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

  // Throttle code sends to stop email-bombing: per-IP and per-email.
  await rateLimit(`otp-req:ip:${clientIp(req)}`, 12, 600);
  await rateLimit(`otp-req:email:${email}`, 5, 600);

  try {
    await sendSignInOtp(email);
  } catch {
    return error("Could not send the verification code. Try again.", 502);
  }
  return json({ ok: true });
});
