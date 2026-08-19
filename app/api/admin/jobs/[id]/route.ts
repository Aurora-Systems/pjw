import type { NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";
import { parseBody } from "@/lib/validate";
import { logAdminAction } from "@/lib/admin-audit";
import { notify } from "@/lib/notify";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

const bodySchema = z.object({
  status: z.literal("cancelled"),
  reason: z.string().trim().max(500).optional(),
});

/**
 * PATCH /api/admin/jobs/:id — an admin takes a job down. Cancellation is the only
 * transition offered here; nothing else about a job is editable from the console.
 *
 * Guard (mirrors PATCH /api/jobs/:id): a job with hired_count > 0 must NOT be cancelled.
 * `status = 'open'` is not enough on its own — a multi-hire job deliberately stays 'open'
 * while partially staffed, so cancelling on status alone would kill a job on which providers
 * already hold confirmed bookings and have each paid the 10% commission. Once anyone is
 * hired, the admin cancels the individual BOOKINGS instead (that path refunds commission).
 */
export const PATCH = safe(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const admin = await requireRole(req, "admin");
  const { id } = await params;
  const body = await parseBody(req, bodySchema);

  const found = await sql`
    SELECT id, title, status, hired_count, customer_id FROM jobs WHERE id = ${id}
  `;
  if (found.length === 0) return error("Job not found", 404);
  const job = found[0];

  // Read first purely so the admin gets a specific reason; the UPDATE below re-checks both
  // conditions in its WHERE, so a concurrent hire between the two still cannot slip through.
  if (Number(job.hired_count) > 0) {
    return error(
      `Someone is already hired on this job (${job.hired_count} of them). Cancel their booking instead — that refunds the provider's commission.`,
      409
    );
  }
  if (job.status !== "open") {
    return error(`This job is already ${job.status}.`, 409);
  }

  const updated = await sql`
    UPDATE jobs SET status = 'cancelled'
    WHERE id = ${id} AND status = 'open' AND hired_count = 0
    RETURNING *
  `;
  if (updated.length === 0) {
    return error("This job changed while you were cancelling it. Reload and try again.", 409);
  }

  await logAdminAction({
    admin_id: admin.sub,
    action: "job.cancel",
    target_type: "job",
    target_id: id,
    detail: { title: job.title, previous_status: job.status, customer_id: job.customer_id },
    reason: body.reason ?? null,
  });

  await notify(
    String(job.customer_id),
    "jobs",
    "Your job was cancelled",
    body.reason
      ? `"${job.title}" was cancelled by PocketJobs support: ${body.reason}`
      : `"${job.title}" was cancelled by PocketJobs support.`,
    { entity: "job", id }
  );

  return json({ job: updated[0] });
});
