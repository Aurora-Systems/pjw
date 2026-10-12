import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { json, preflight, safe } from "@/lib/http";
import { parseBody } from "@/lib/validate";
import { broadcastSchema, buildEmail } from "@/lib/broadcast";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * POST /api/admin/broadcasts/preview — the email exactly as a recipient will see it,
 * rendered by the same code that sends it, personalised with the admin's own first name.
 */
export const POST = safe(async (req: NextRequest) => {
  const admin = await requireRole(req, "admin");
  const input = await parseBody(req, broadcastSchema);
  const me = await sql`SELECT id, email, full_name FROM users WHERE id = ${admin.sub}`;
  const firstName = String(me[0]?.full_name ?? "").trim().split(" ")[0] || null;
  const email = buildEmail(input, { user_id: admin.sub, email: String(me[0]?.email ?? ""), first_name: firstName });
  return json({ subject: email.subject, html: email.html });
});
