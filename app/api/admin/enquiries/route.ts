import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { json, preflight, safe } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

const STATUSES = ["open", "answered", "closed"] as const;

/**
 * GET /api/admin/enquiries?status=&q=&limit=&offset=
 *
 * status: open | answered | closed (anything else, including "all" or omitted, = no filter).
 * q:      substring match over name / email / phone / subject / message.
 *
 * `counts` is the per-status tally for the CURRENT search (not the whole table) so the
 * status tabs and the list agree: searching "moyo" and seeing "Open (2)" must mean two
 * rows when you click it. `total` is the count for the current status + search, i.e. the
 * number of rows this list would have without paging.
 */
export const GET = safe(async (req: NextRequest) => {
  await requireRole(req, "admin");

  const p = req.nextUrl.searchParams;
  const rawStatus = (p.get("status") || "").trim();
  const status = (STATUSES as readonly string[]).includes(rawStatus) ? rawStatus : null;
  const q = (p.get("q") || "").trim() || null;
  const limit = Math.min(Math.max(Number(p.get("limit")) || 50, 1), 200);
  const offset = Math.max(Number(p.get("offset")) || 0, 0);

  // Shared search predicate — kept identical between the tally and the page query.
  const searchSql = `
    ($1::text IS NULL OR e.name ILIKE '%' || $1 || '%'
                      OR e.email ILIKE '%' || $1 || '%'
                      OR e.phone ILIKE '%' || $1 || '%'
                      OR e.subject ILIKE '%' || $1 || '%'
                      OR e.message ILIKE '%' || $1 || '%')`;

  const tally = await sql.query(
    `SELECT e.status, COUNT(*)::int AS n FROM enquiries e WHERE ${searchSql} GROUP BY e.status`,
    [q]
  );
  const counts = { open: 0, answered: 0, closed: 0 };
  for (const row of tally as { status: string; n: number }[]) {
    if (row.status in counts) counts[row.status as keyof typeof counts] = row.n;
  }
  const total = status
    ? counts[status as keyof typeof counts]
    : counts.open + counts.answered + counts.closed;

  const text = `
    SELECT e.id, e.source, e.user_id, e.name, e.email, e.phone, e.subject, e.message,
           e.status, e.assigned_to, e.answered_at, e.created_at,
           (SELECT COUNT(*) FROM enquiry_replies r WHERE r.enquiry_id = e.id)::int AS reply_count
    FROM enquiries e
    WHERE ($2::text IS NULL OR e.status = $2)
      AND ${searchSql}
    ORDER BY (e.status = 'open') DESC, e.created_at DESC
    LIMIT $3 OFFSET $4`;
  const enquiries = await sql.query(text, [q, status, limit, offset]);

  return json({ enquiries, total, counts });
});
