import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";
import { buildUserExport } from "@/lib/dataExport";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * POST /api/account/data-request — email the signed-in user a copy of their data.
 * Used by the mobile "Request my data" button (the app has no file-download/share plugin,
 * and emailing to the registered address is also the safer delivery channel).
 */
export const POST = safe(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  await rateLimit(`data-request:${auth.sub}`, 3, 86400); // 3 per day

  const rows = await sql`SELECT email, full_name FROM users WHERE id = ${auth.sub}`;
  const to = rows[0]?.email as string | null;
  if (!to) {
    return error("Your account has no email address on file to send the export to.", 400);
  }
  if (!isEmailConfigured()) {
    return error("Data export by email isn't available right now. Please contact support@pocketjobs.co.", 503);
  }

  const data = await buildUserExport(auth.sub);
  const sent = await sendEmail(
    to,
    "Your PocketJobs data export",
    `<p>Hi ${rows[0].full_name ?? "there"},</p>
     <p>Attached is a copy of the personal data we hold about you on PocketJobs, in JSON format.</p>
     <p>If you didn't request this, please contact us at support@pocketjobs.co immediately.</p>
     <p>— PocketJobs</p>`,
    [{ filename: "pocketjobs-my-data.json", content: JSON.stringify(data, null, 2) }]
  );

  // Only claim it was sent if Resend actually accepted it.
  if (!sent) return error("We couldn't send your export just now. Please try again shortly.", 502);
  return json({ ok: true, email: to });
});
