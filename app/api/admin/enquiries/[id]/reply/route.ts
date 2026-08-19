import type { NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";
import { parseBody } from "@/lib/validate";
import { logAdminAction } from "@/lib/admin-audit";
import { enquiryReplyEmail, isEmailConfigured, sendEmail } from "@/lib/email";
import { notify } from "@/lib/notify";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

const replySchema = z.object({
  body: z.string().trim().min(1, "A reply is required").max(5000, "Reply is too long"),
});

/**
 * POST /api/admin/enquiries/:id/reply — record an admin's answer and email it to the person
 * who wrote in.
 *
 * Order matters: the reply row is written FIRST and the send is best-effort afterwards. If
 * email is unconfigured, the address is missing, or Resend is down, we still return 200 with
 * emailed:false and the admin's typed answer is safely stored — losing it would be far worse
 * than not delivering it, and it can be re-sent later. emailed_at is only stamped on a send
 * the mail API actually accepted, so "recorded but never sent" stays visible in the thread.
 */
export const POST = safe(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const admin = await requireRole(req, "admin");
  const { id } = await params;
  const { body } = await parseBody(req, replySchema);

  const found = await sql`
    SELECT id, user_id, name, email, subject, message, status FROM enquiries WHERE id = ${id}
  `;
  if (found.length === 0) return error("Enquiry not found", 404);
  const enquiry = found[0];

  const inserted = await sql`
    INSERT INTO enquiry_replies (enquiry_id, admin_id, body)
    VALUES (${id}, ${admin.sub}, ${body})
    RETURNING id, enquiry_id, admin_id, body, emailed_at, created_at
  `;
  const reply = inserted[0];

  // --- everything below here is best-effort; the reply is already saved ---

  let emailed = false;
  const to = (enquiry.email as string | null)?.trim();
  if (to && isEmailConfigured()) {
    try {
      const subject = (enquiry.subject as string | null) || null;
      emailed = await sendEmail(
        to,
        subject ? `Re: ${subject}` : "Re: your message to PocketJobs",
        enquiryReplyEmail({
          name: (enquiry.name as string) || "there",
          subject,
          originalMessage: (enquiry.message as string) || "",
          reply: body,
          adminName: admin.name || null,
        })
      );
      if (emailed) {
        const stamped = await sql`
          UPDATE enquiry_replies SET emailed_at = now() WHERE id = ${reply.id} RETURNING emailed_at
        `;
        reply.emailed_at = stamped[0]?.emailed_at ?? null;
      }
    } catch (e) {
      console.error("[enquiries] reply email failed (reply is saved):", e);
      emailed = false;
    }
  }

  // Enquiries raised in the app often have no email on file, so mirror the answer in-app.
  if (enquiry.user_id) {
    await notify(
      enquiry.user_id as string,
      "system",
      "Support replied to your message",
      body.length > 140 ? `${body.slice(0, 137)}...` : body
    );
  }

  // Answering an enquiry moves it to 'answered' and stamps when the customer first got a
  // reply. A CLOSED enquiry stays closed — an admin adding a final note to a resolved thread
  // shouldn't drag it back into the open queue. Whoever replies first also picks it up.
  const updated = await sql`
    UPDATE enquiries
    SET status = CASE WHEN status = 'closed' THEN status ELSE 'answered' END,
        answered_at = COALESCE(answered_at, now()),
        assigned_to = COALESCE(assigned_to, ${admin.sub}),
        updated_at = now()
    WHERE id = ${id}
    RETURNING status
  `;

  await logAdminAction({
    admin_id: admin.sub,
    action: "enquiry.reply",
    target_type: "enquiry",
    target_id: id,
    detail: {
      reply_id: reply.id,
      emailed,
      emailed_to: emailed ? to : null,
      status: updated[0]?.status ?? enquiry.status,
    },
    reason: null,
  });

  return json({ reply: { ...reply, admin_name: admin.name }, emailed }, { status: 201 });
});
