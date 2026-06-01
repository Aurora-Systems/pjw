import { NextResponse } from "next/server";

const ALLOW_ORIGIN = process.env.CORS_ALLOW_ORIGIN || "*";

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
