import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { HttpError } from "@/lib/http";

/** Best-effort client IP from proxy headers (Netlify/Vercel set x-forwarded-for). */
export function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/**
 * Fixed-window rate limit. Throws HttpError(429) when `key` exceeds `limit` hits within
 * `windowSec`. Backed by Postgres so it works across serverless instances. Fail-open: if the
 * limiter store itself errors, we allow the request rather than block legitimate traffic.
 */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<void> {
  const win = Math.floor(Date.now() / 1000 / windowSec);
  const bucket = `${key}:${win}`;
  let count = 0;
  try {
    const rows = await sql`
      INSERT INTO rate_limits (bucket, count, expires_at)
      VALUES (${bucket}, 1, now() + (${windowSec} || ' seconds')::interval)
      ON CONFLICT (bucket) DO UPDATE SET count = rate_limits.count + 1
      RETURNING count
    `;
    count = Number(rows[0]?.count ?? 0);
  } catch (e) {
    console.error("[ratelimit] store error (failing open):", e);
    return;
  }
  if (count > limit) {
    throw new HttpError("Too many requests. Please wait a moment and try again.", 429);
  }
}
