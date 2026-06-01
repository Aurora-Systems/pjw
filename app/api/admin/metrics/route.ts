import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** GET /api/admin/metrics — live platform metrics for the admin companion. */
export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "admin") return error("Admins only", 403);

  const users = await sql`SELECT COUNT(*)::int AS n FROM users`;
  const jobsToday = await sql`SELECT COUNT(*)::int AS n FROM jobs WHERE created_at >= current_date`;
  const disputes = await sql`SELECT COUNT(*)::int AS n FROM disputes WHERE status = 'open'`;
  const pending = await sql`
    SELECT COUNT(*)::int AS n FROM users WHERE role = 'provider' AND id_verified = false
  `;

  return json({
    active_users: users[0].n,
    jobs_today: jobsToday[0].n,
    open_disputes: disputes[0].n,
    pending_verifications: pending[0].n,
  });
}
