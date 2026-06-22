import { sql } from "@/lib/db";
import { json, error } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/health — unauthenticated liveness/readiness probe (DB round-trip). */
export async function GET() {
  try {
    await sql`SELECT 1`;
    return json({ ok: true, db: "up", commit: process.env.COMMIT_REF || process.env.VERCEL_GIT_COMMIT_SHA || null });
  } catch {
    return error("Database unavailable", 503);
  }
}
