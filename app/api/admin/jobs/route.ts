import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { json, preflight, safe } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

const STATUSES = ["open", "assigned", "completed", "cancelled"] as const;

const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));
const money = (v: unknown) => (v === null || v === undefined ? null : Number(v));

/** Shared by the page query and the count query so the two filters cannot drift apart. */
const WHERE = `
  ($1::text IS NULL OR j.status = $1)
  AND ($2::text IS NULL
       OR j.title ILIKE '%' || $2 || '%'
       OR j.category ILIKE '%' || $2 || '%'
       OR j.location ILIKE '%' || $2 || '%'
       OR u.full_name ILIKE '%' || $2 || '%')
`;

/**
 * GET /api/admin/jobs — every job on the platform, newest first.
 *
 * Query params: status (open|assigned|completed|cancelled; anything else = all),
 *               q (title / category / location / customer name), limit (max 200), offset.
 *
 * `offers` is the number of bids on the job. Note `status` alone does not tell you whether
 * anyone is hired: a multi-hire job stays 'open' while it is partially staffed, so read
 * hired_count / workers_needed for that (and see the cancel guard in ./[id]).
 */
export const GET = safe(async (req: NextRequest) => {
  await requireRole(req, "admin");

  const p = req.nextUrl.searchParams;
  const statusParam = p.get("status");
  const status = STATUSES.includes(statusParam as (typeof STATUSES)[number]) ? statusParam : null;
  const q = p.get("q")?.trim() || null;
  const limit = Math.min(Math.max(Number(p.get("limit")) || 50, 1), 200);
  const offset = Math.max(Number(p.get("offset")) || 0, 0);

  const pageSql = `
    SELECT j.id, j.title, j.category, j.status, j.budget_min, j.budget_max, j.created_at,
           j.location, j.workers_needed, j.hired_count,
           (SELECT count(*) FROM bids b WHERE b.job_id = j.id) AS offers,
           u.full_name AS customer_name, u.id AS customer_id
    FROM jobs j
    JOIN users u ON u.id = j.customer_id
    WHERE ${WHERE}
    ORDER BY j.created_at DESC
    LIMIT $3 OFFSET $4
  `;
  const countSql = `
    SELECT count(*) AS total FROM jobs j JOIN users u ON u.id = j.customer_id WHERE ${WHERE}
  `;

  const [rows, counted] = await Promise.all([
    sql.query(pageSql, [status, q, limit, offset]),
    sql.query(countSql, [status, q]),
  ]);

  // numeric/bigint arrive as strings over the wire; the console expects numbers.
  const jobs = rows.map((r: Record<string, unknown>) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    status: r.status,
    budget_min: money(r.budget_min),
    budget_max: money(r.budget_max),
    created_at: r.created_at,
    location: r.location,
    workers_needed: num(r.workers_needed),
    hired_count: num(r.hired_count),
    offers: num(r.offers),
    customer_name: r.customer_name,
    customer_id: r.customer_id,
  }));

  return json({ jobs, total: num(counted[0]?.total) });
});
