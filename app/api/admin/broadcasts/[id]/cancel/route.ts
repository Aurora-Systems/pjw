import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";
import { logAdminAction } from "@/lib/admin-audit";
import { broadcastProgress } from "@/lib/broadcast";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * POST /api/admin/broadcasts/:id/cancel — stop a mass email part-way (say, a typo spotted
 * after it started). Whoever already got it keeps it; nobody else will.
 */
export const POST = safe(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const admin = await requireRole(req, "admin");
  const { id } = await params;
  const updated = await sql`
    UPDATE email_broadcasts SET status = 'cancelled', finished_at = now()
    WHERE id = ${id} AND status IN ('sending', 'paused')
    RETURNING id`;
  if (updated.length === 0) return error("Only a sending or paused email can be stopped.", 409);
  const progress = await broadcastProgress(id);
  await logAdminAction({
    admin_id: admin.sub,
    action: "broadcast.cancel",
    target_type: "broadcast",
    target_id: id,
    detail: { sent: progress?.sent ?? null, not_sent: progress?.remaining ?? null },
    reason: null,
  });
  return json({ progress });
});
