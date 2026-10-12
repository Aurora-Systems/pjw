import type { NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";
import { parseBody } from "@/lib/validate";
import { sendEmailBatch } from "@/lib/email";
import { broadcastSchema, buildEmail } from "@/lib/broadcast";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

const testSchema = z.object({
  draft: broadcastSchema,
  /** Defaults to the admin's own address. */
  to: z.string().trim().email("Enter a valid email address for the test").optional().nullable(),
});

/**
 * POST /api/admin/broadcasts/test — send one copy to the admin (or an address they type)
 * before mailing everyone. It goes through the same batch path as the real send, so a test
 * that arrives proves the real thing will too.
 */
export const POST = safe(async (req: NextRequest) => {
  const admin = await requireRole(req, "admin");
  const { draft, to } = await parseBody(req, testSchema);
  const me = await sql`SELECT email, full_name FROM users WHERE id = ${admin.sub}`;
  const target = to || (me[0]?.email as string | null);
  if (!target) return error("Your account has no email address. Type one in to send the test to.", 400);

  const firstName = String(me[0]?.full_name ?? "").trim().split(" ")[0] || null;
  const email = buildEmail(draft, { user_id: admin.sub, email: target, first_name: firstName });
  const result = await sendEmailBatch([{ ...email, subject: `[Test] ${email.subject}` }]);
  if (!result.ok) return error(`The test was not sent: ${result.message}`, 502);
  return json({ ok: true, sent_to: target });
});
