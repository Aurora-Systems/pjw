import type { NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";
import { parseBody } from "@/lib/validate";
import { logAdminAction } from "@/lib/admin-audit";
import { notify } from "@/lib/notify";
import { adminMessageEmail, isEmailConfigured, sendEmail, splitSubjectLine } from "@/lib/email";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

const bodySchema = z.object({
  status: z.literal("cancelled"),
  // Admins use this as a letter to the poster, not a one-line reason, so it gets room.
  reason: z.string().trim().max(3000, "Keep the message under 3000 characters").optional(),
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
    SELECT j.id, j.title, j.status, j.hired_count, j.customer_id, u.email AS customer_email
    FROM jobs j JOIN users u ON u.id = j.customer_id
    WHERE j.id = ${id}
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

  // The admin's message has to reach the poster by EMAIL. An in-app notice alone was the
  // whole delivery path before, and the people whose stale or misplaced posts get taken down
  // are by definition people who have stopped opening the app — sixteen of these letters sat
  // unread in the notifications table while the admin believed they had been sent.
  const { subject, body: message } = splitSubjectLine(body.reason ?? "");
  const title = String(job.title);
  const to = (job.customer_email as string | null)?.trim() || null;
  let emailed = false;
  if (message && to && isEmailConfigured()) {
    emailed = await sendEmail(
      to,
      subject || `Update on your PocketJobs post "${title}"`,
      adminMessageEmail({ message, jobTitle: title })
    );
  }

  await logAdminAction({
    admin_id: admin.sub,
    action: "job.cancel",
    target_type: "job",
    target_id: id,
    detail: {
      title,
      previous_status: job.status,
      customer_id: job.customer_id,
      emailed,
      emailed_to: emailed ? to : null,
    },
    reason: body.reason ?? null,
  });

  // Still mirrored in-app for anyone who does open it.
  await notify(
    String(job.customer_id),
    "jobs",
    subject || "Your job was cancelled",
    message
      ? `"${title}" was taken down by PocketJobs support. ${message}`
      : `"${title}" was taken down by PocketJobs support.`,
    { entity: "job", id }
  );

  // `emailed` drives the console's delivery note, so the admin knows when nothing left the
  // building and they need to follow up another way.
  return json({ job: updated[0], emailed, emailed_to: emailed ? to : null, has_email: Boolean(to) });
});
