import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { platformFromUserAgent, storeUrlFor } from "../lib/appStores";

/**
 * GET /download — one shareable link for the mobile app.
 *
 * An iPhone or iPad goes to the App Store, an Android phone to Google Play, and anything
 * else (a desktop, or a device we can't tell) lands on the "Get the app" section of the home
 * page, which offers both stores and a QR code. This is the URL printed in that QR code, so a
 * desktop visitor scanning it with their phone is sent straight to the right store.
 */
export function GET(req: NextRequest) {
  const store = storeUrlFor(platformFromUserAgent(req.headers.get("user-agent")));
  const res = NextResponse.redirect(store ?? new URL("/#get-the-app", req.url), 302);
  // The answer depends on the device, so no shared cache may store one visitor's redirect.
  res.headers.set("Cache-Control", "private, no-store");
  res.headers.set("Vary", "User-Agent");
  return res;
}
