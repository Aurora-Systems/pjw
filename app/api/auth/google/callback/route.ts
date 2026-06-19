import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { exchangeCode } from "@/lib/google";
import { resolveLocalUser } from "@/lib/users";
import { signToken, type UserRole } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * GET /api/auth/google/callback — Google redirects here with ?code&state.
 * We exchange the code, map to a local user, mint our app JWT, then hand it back:
 *  - web: redirect to /auth/complete#token=… (a page that stores it)
 *  - mobile: redirect to the app's deep link with the token
 */
export async function GET(req: NextRequest) {
  const base = process.env.APP_PUBLIC_URL || "http://localhost:3000";
  // Disabled unless ENABLE_GOOGLE_AUTH=true — prevents OAuth from minting accounts that bypass OTP.
  if (process.env.ENABLE_GOOGLE_AUTH !== "true") {
    return NextResponse.redirect(`${base}/login?error=google_disabled`);
  }
  const scheme = process.env.MOBILE_DEEPLINK_SCHEME || "co.pocketjobs.app";
  const p = req.nextUrl.searchParams;
  const code = p.get("code");
  const error = p.get("error");

  let platform = "web";
  let role: UserRole = "customer";
  try {
    const state = JSON.parse(Buffer.from(p.get("state") || "", "base64url").toString("utf8"));
    if (state.platform === "mobile") platform = "mobile";
    if (["customer", "provider", "corporate"].includes(state.role)) role = state.role;
  } catch {
    /* ignore bad state */
  }

  const fail = (msg: string) =>
    platform === "mobile"
      ? NextResponse.redirect(`${scheme}://google-auth?error=${encodeURIComponent(msg)}`)
      : NextResponse.redirect(`${base}/login?error=${encodeURIComponent(msg)}`);

  if (error || !code) return fail(error || "google_cancelled");

  try {
    const id = await exchangeCode(code);
    if (!id.email || !id.email_verified) return fail("email_unverified");

    const user = await resolveLocalUser(`google:${id.sub}`, id.email, id.name, role, undefined, true);
    if (!user) return fail("google_failed");
    if (id.picture) {
      await sql`UPDATE users SET avatar_url = COALESCE(avatar_url, ${id.picture}) WHERE id = ${user.id}`;
    }
    const token = await signToken({ sub: user.id, role: user.role, name: user.full_name });

    return platform === "mobile"
      ? NextResponse.redirect(`${scheme}://google-auth?token=${encodeURIComponent(token)}`)
      : NextResponse.redirect(`${base}/auth/complete#token=${encodeURIComponent(token)}`);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "google_failed");
  }
}
