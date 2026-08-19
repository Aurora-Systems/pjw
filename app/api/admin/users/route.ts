import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { json, preflight, safe } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

const ROLES = ["customer", "provider", "corporate", "admin"] as const;
const STATUSES = ["all", "active", "banned", "unverified"] as const;

const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));

/**
 * The filter, written once and shared by the count query and the page query so the two can
 * never drift apart. Uses $1 role, $2 q, $3 status; the page query adds $4 limit, $5 offset.
 */
const WHERE = `
  ($1::text IS NULL OR u.role = $1)
  AND ($2::text IS NULL
       OR u.full_name ILIKE '%' || $2 || '%'
       OR u.email ILIKE '%' || $2 || '%'
       OR u.phone ILIKE '%' || $2 || '%')
  AND (
    $3 = 'all'
    OR ($3 = 'active'     AND u.deleted_at IS NULL)
    OR ($3 = 'banned'     AND u.deleted_at IS NOT NULL)
    -- "unverified" means "still waiting on the work gate", so banned accounts are excluded:
    -- those belong in the banned tab, not in an approval queue.
    OR ($3 = 'unverified' AND u.id_verified = false AND u.deleted_at IS NULL)
  )
`;

/**
 * GET /api/admin/users — the admin user directory.
 *
 * Query params:
 *   q       — free text over full_name / email / phone
 *   role    — customer | provider | corporate | admin  (anything else is ignored)
 *   status  — all (default) | active | banned | unverified
 *   limit   — page size (default 50, max 200)
 *   offset  — page offset
 *
 * Returns { users, total }, where `total` is the size of the *filtered* set (not the page)
 * so the console can paginate. Two notes on the payload:
 *
 *  - `banned` is `deleted_at IS NOT NULL` — bans are soft deletes (see banUser in lib/auth).
 *  - `id_verified` and `didit_status` are DIFFERENT things and both are exposed on purpose.
 *    `id_verified` is the permission-to-work gate (an admin grants it); `didit_status` is the
 *    KYC result and the ONLY source of the public "Verified" badge. This is an admin-only
 *    payload, so unlike /api/providers it shows the raw gate instead of masking it.
 */
export const GET = safe(async (req: NextRequest) => {
  await requireRole(req, "admin");

  const p = req.nextUrl.searchParams;
  const q = p.get("q")?.trim() || null;
  const roleParam = p.get("role");
  const role = ROLES.includes(roleParam as (typeof ROLES)[number]) ? roleParam : null;
  const statusParam = p.get("status");
  const status = STATUSES.includes(statusParam as (typeof STATUSES)[number]) ? statusParam! : "all";
  const limit = Math.min(Math.max(Number(p.get("limit")) || 50, 1), 200);
  const offset = Math.max(Number(p.get("offset")) || 0, 0);

  // The page is narrowed FIRST (the `page` CTE carries LIMIT/OFFSET) and the per-user counts
  // are computed only for the rows that survive, so the correlated subqueries run `limit`
  // times rather than once per user on the platform.
  const pageSql = `
    WITH page AS (
      SELECT u.id, u.full_name, u.email, u.phone, u.role, u.avatar_url, u.city, u.created_at,
             u.id_verified, u.didit_status, (u.deleted_at IS NOT NULL) AS banned
      FROM users u
      WHERE ${WHERE}
      ORDER BY u.created_at DESC
      LIMIT $4 OFFSET $5
    )
    SELECT f.*,
           -- Only providers have a wallet; everyone else gets null rather than a fake 0.
           CASE WHEN f.role = 'provider' THEN pp.balance END AS balance,
           (SELECT count(*) FROM jobs j WHERE j.customer_id = f.id) AS jobs_count,
           -- Bookings on EITHER side, so the number reads as "jobs worked" for a provider
           -- and "jobs hired out" for a customer.
           (SELECT count(*) FROM bookings b
             WHERE b.customer_id = f.id OR b.provider_id = f.id) AS bookings_count
    FROM page f
    LEFT JOIN provider_profiles pp ON pp.user_id = f.id
    ORDER BY f.created_at DESC
  `;
  const countSql = `SELECT count(*) AS total FROM users u WHERE ${WHERE}`;

  // Counted separately rather than with COUNT(*) OVER (): a window count vanishes when the
  // page itself is empty (e.g. an offset past the end), which would report total = 0 and
  // strand the console on the last page.
  const [rows, counted] = await Promise.all([
    sql.query(pageSql, [role, q, status, limit, offset]),
    sql.query(countSql, [role, q, status]),
  ]);

  // Postgres sends numeric/bigint as strings over the wire; the console expects numbers.
  const users = rows.map((r: Record<string, unknown>) => ({
    id: r.id,
    full_name: r.full_name,
    email: r.email,
    phone: r.phone,
    role: r.role,
    avatar_url: r.avatar_url,
    city: r.city,
    created_at: r.created_at,
    id_verified: r.id_verified,
    didit_status: r.didit_status,
    banned: r.banned,
    balance: r.balance === null || r.balance === undefined ? null : Number(r.balance),
    jobs_count: num(r.jobs_count),
    bookings_count: num(r.bookings_count),
  }));

  return json({ users, total: num(counted[0]?.total) });
});
