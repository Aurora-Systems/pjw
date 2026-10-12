import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { json, error, preflight, safe } from "@/lib/http";
import { verifyUnsubscribe } from "@/lib/unsubscribe";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * POST /api/email/unsubscribe?u=<userId>&t=<token> — opt out of (or back into) announcement
 * emails. No sign-in: the signed token in the link is the proof.
 *
 * Mail apps call this directly from their own "Unsubscribe" button (RFC 8058 one-click),
 * posting the form body "List-Unsubscribe=One-Click". The /unsubscribe page posts JSON
 * instead, and can send { "action": "resubscribe" } to undo it. There is deliberately no GET:
 * security scanners open every link in an email, and a GET would unsubscribe people at random.
 */
export const POST = safe(async (req: NextRequest) => {
  const p = req.nextUrl.searchParams;
  const userId = p.get("u");
  if (!verifyUnsubscribe(userId, p.get("t"))) return error("This unsubscribe link is not valid.", 400);

  let action = "unsubscribe";
  if ((req.headers.get("content-type") ?? "").includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as { action?: string };
    if (body.action === "resubscribe") action = "resubscribe";
  }

  const rows =
    action === "resubscribe"
      ? await sql`UPDATE users SET email_unsubscribed_at = NULL WHERE id = ${userId} RETURNING email_unsubscribed_at`
      : await sql`
          UPDATE users SET email_unsubscribed_at = COALESCE(email_unsubscribed_at, now())
          WHERE id = ${userId} RETURNING email_unsubscribed_at`;
  if (rows.length === 0) return error("That account no longer exists.", 404);
  return json({ ok: true, unsubscribed: rows[0].email_unsubscribed_at !== null });
});
