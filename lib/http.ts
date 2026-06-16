import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOW_ORIGIN = process.env.CORS_ALLOW_ORIGIN || "*";

/**
 * The public base URL of the site, for building redirect/callback URLs (e.g. the
 * Didit return URL). Prefers APP_PUBLIC_URL, then the incoming request's
 * forwarded host (so it's correct on Netlify even if the env var is unset), and
 * only falls back to localhost in local dev.
 */
export function publicBaseUrl(req: NextRequest): string {
  if (process.env.APP_PUBLIC_URL) return process.env.APP_PUBLIC_URL.replace(/\/+$/, "");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": ALLOW_ORIGIN,
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/** JSON response with CORS headers applied (mobile app calls these cross-origin). */
export function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, {
    status: init?.status ?? 200,
    headers: corsHeaders,
  });
}

export function error(message: string, status = 400) {
  return json({ error: message }, { status });
}

/** Preflight handler — re-export as `OPTIONS` from any route that needs it. */
export function preflight() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
