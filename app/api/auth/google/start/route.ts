import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { consentUrl, isGoogleConfigured } from "@/lib/google";

export const runtime = "nodejs";

/**
 * GET /api/auth/google/start?role=&platform= — kicks off Google OAuth.
 * Redirects the browser to Google's consent screen.
 */
export async function GET(req: NextRequest) {
  const base = process.env.APP_PUBLIC_URL || "http://localhost:3000";
  // Google sign-in is disabled (we use passwordless email OTP). This endpoint stays
  // dormant unless ENABLE_GOOGLE_AUTH=true, so it can't create accounts that skip OTP.
  if (process.env.ENABLE_GOOGLE_AUTH !== "true") {
    return NextResponse.redirect(`${base}/login?error=google_disabled`);
  }
  if (!isGoogleConfigured()) {
    return NextResponse.redirect(`${base}/login?error=google_not_configured`);
  }
  const p = req.nextUrl.searchParams;
  const role = p.get("role") || "customer";
  const platform = p.get("platform") === "mobile" ? "mobile" : "web";
  const state = Buffer.from(JSON.stringify({ role, platform, t: Date.now() })).toString("base64url");
  return NextResponse.redirect(consentUrl(state));
}
