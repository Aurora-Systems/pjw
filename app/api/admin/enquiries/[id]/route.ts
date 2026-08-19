import type { NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";
import { parseBody } from "@/lib/validate";
import { logAdminAction } from "@/lib/admin-audit";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * GET /api/admin/enquiries/:id — one enquiry plus its full reply thread.
 * `user_name` is the linked account's current name (the enquiry stores the name as it was
 * typed, which can be stale or a pseudonym).
 */
export const GET = safe(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireRole(req, "admin");
  const { id } = await params;

  const rows = await sql`
    SELECT e.*,
           u.full_name AS user_name,
           a.full_name AS assigned_to_name
    FROM enquiries e
    LEFT JOIN users u ON u.id = e.user_id
    LEFT JOIN users a ON a.id = e.assigned_to
    WHERE e.id = ${id}
  `;
  if (rows.length === 0) return error("Enquiry not found", 404);

  const replies = await sql`
    SELECT r.id, r.admin_id, u.full_name AS admin_name, r.body, r.emailed_at, r.created_at
    FROM enquiry_replies r
    LEFT JOIN users u ON u.id = r.admin_id
    WHERE r.enquiry_id = ${id}
    ORDER BY r.created_at ASC
  `;

  return json({ enquiry: rows[0], replies });
});

const patchSchema = z.object({
  status: z.enum(["open", "answered", "closed"]),
  reason: z.string().trim().max(500).nullish(),
});

/**
 * PATCH /api/admin/enquiries/:id — move an enquiry through open → answered → closed.
 *
 * answered_at is stamped the first time it reaches 'answered' and then left alone: it
 * records when the customer first got an answer, so re-opening and re-closing a thread
 * must not rewrite that history.
 */
export const PATCH = safe(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const admin = await requireRole(req, "admin");
  const { id } = await params;
  const body = await parseBody(req, patchSchema);

  const before = await sql`SELECT status FROM enquiries WHERE id = ${id}`;
  if (before.length === 0) return error("Enquiry not found", 404);

  const rows = await sql`
    UPDATE enquiries
    SET status = ${body.status},
        answered_at = CASE WHEN ${body.status} = 'answered' THEN COALESCE(answered_at, now()) ELSE answered_at END,
        updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;

  await logAdminAction({
    admin_id: admin.sub,
    action: "enquiry.status",
    target_type: "enquiry",
    target_id: id,
    detail: { from: before[0].status, to: body.status },
    reason: body.reason ?? null,
  });

  return json({ enquiry: rows[0] });
});
