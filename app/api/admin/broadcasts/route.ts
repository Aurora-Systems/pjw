import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";
import { parseBody } from "@/lib/validate";
import { logAdminAction } from "@/lib/admin-audit";
import { broadcastSchema, createBroadcast } from "@/lib/broadcast";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** GET /api/admin/broadcasts — the 50 most recent mass emails, newest first. */
export const GET = safe(async (req: NextRequest) => {
  await requireRole(req, "admin");
  const broadcasts = await sql`
    SELECT b.id, b.subject, b.audience, b.service_notice, b.status, b.status_note,
           b.total, b.sent_count, b.failed_count, b.created_at, b.finished_at,
           u.full_name AS created_by_name
    FROM email_broadcasts b
    LEFT JOIN users u ON u.id = b.created_by
    ORDER BY b.created_at DESC
    LIMIT 50
  `;
  return json({ broadcasts });
});

/**
 * POST /api/admin/broadcasts — create a mass email and freeze its recipient list. Nothing
 * is sent here: the console then calls POST /:id/send until everyone has been reached.
 */
export const POST = safe(async (req: NextRequest) => {
  const admin = await requireRole(req, "admin");
  const input = await parseBody(req, broadcastSchema);

  // A double-click or a resubmitted form must not mail everyone twice.
  const recent = await sql`
    SELECT id FROM email_broadcasts
    WHERE subject = ${input.subject} AND body = ${input.body} AND audience = ${input.audience}
      AND status <> 'cancelled' AND created_at > now() - interval '10 minutes'
    LIMIT 1
  `;
  if (recent.length > 0) {
    return error("This exact email was already started in the last 10 minutes. Open it below to resume it.", 409);
  }

  const broadcast = await createBroadcast(input, admin.sub);
  if (!broadcast) return error("Nobody in that audience can receive email right now.", 400);

  await logAdminAction({
    admin_id: admin.sub,
    action: "broadcast.create",
    target_type: "broadcast",
    target_id: broadcast.id as string,
    detail: {
      subject: input.subject,
      audience: input.audience,
      service_notice: input.service_notice,
      recipients: Number(broadcast.total),
    },
    reason: null,
  });

  return json({ broadcast }, { status: 201 });
});
