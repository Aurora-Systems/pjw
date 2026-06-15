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
  if (!isGoogleConfigured()) {
    return NextResponse.redirect(`${base}/login?error=google_not_configured`);
  }
  const p = req.nextUrl.searchParams;
  const role = p.get("role") || "customer";
  const platform = p.get("platform") === "mobile" ? "mobile" : "web";
  const state = Buffer.from(JSON.stringify({ role, platform, t: Date.now() })).toString("base64url");
  return NextResponse.redirect(consentUrl(state));
}
