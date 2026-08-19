import type { NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, preflight, safe } from "@/lib/http";
import { parseBody } from "@/lib/validate";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";

/** Preflight — the Ionic app posts here cross-origin, and so does the marketing site. */
export function OPTIONS() {
  return preflight();
}

/**
 * Deliberately loose: this only has to reject obvious junk ("n/a", "no thanks") so we
 * don't try to email it later. Anything shaped like an address is accepted — bouncing a
 * real customer's unusual address would cost us far more than storing a dud one.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const enquirySchema = z.object({
  name: z.string().trim().min(1, "Your name is required").max(120, "Name is too long"),
  email: z
    .string()
    .trim()
    .max(200, "Email is too long")
    .refine((v) => v === "" || EMAIL_RE.test(v), "Enter a valid email address")
    .nullish(),
  phone: z.string().trim().max(40, "Phone number is too long").nullish(),
  subject: z.string().trim().max(200, "Subject is too long").nullish(),
  message: z.string().trim().min(1, "A message is required").max(4000, "Message is too long"),
  // Validated but never rejected — see the normalisation below.
  source: z.string().trim().max(20).nullish(),
});

/** Empty/whitespace-only optional fields land as NULL rather than "". */
function nullIfBlank(v: string | null | undefined): string | null {
  const t = (v ?? "").trim();
  return t.length ? t : null;
}

/**
 * POST /api/enquiries — PUBLIC (no auth). Support/contact submissions from the marketing
 * site and from in-app support in the Ionic app.
 *
 * Unauthenticated and therefore abuse-exposed, so: hard length caps, required name +
 * message, and a per-IP + per-contact rate limit. The limiter is the shared Postgres-backed
 * one (lib/ratelimit) rather than an in-memory map on purpose — this deploys serverless, so
 * an in-process counter would reset on every cold start and be trivially sidestepped by
 * fanning requests across instances.
 *
 * If a valid bearer token is present we link the row to that account and prefer the
 * account's own name/email over whatever was typed. user_id is only ever taken from a
 * verified token — an anonymous body can never claim to belong to a user.
 */
export const POST = safe(async (req: NextRequest) => {
  // Throttle by IP *before* parsing, so a flood of malformed bodies is capped too.
  await rateLimit(`enquiry:ip:${clientIp(req)}`, 6, 600); // 6 per 10 min per IP

  const body = await parseBody(req, enquirySchema);

  // The DB has a CHECK (source IN ('web','app')). Normalise instead of 400-ing: a client
  // sending an unknown source is our bug to absorb, not a reason to lose the message.
  const source = nullIfBlank(body.source) === "app" ? "app" : "web";

  let name = body.name.trim();
  let email = nullIfBlank(body.email);
  let phone = nullIfBlank(body.phone);
  const subject = nullIfBlank(body.subject);
  const message = body.message.trim();

  // ...and by sender, which survives an IP change (mobile networks rotate them constantly).
  if (email) await rateLimit(`enquiry:email:${email.toLowerCase()}`, 6, 3600);

  // Optional auth: a bad/expired token must not stop a legitimate enquiry, so failures
  // here degrade to an anonymous submission rather than an error.
  let userId: string | null = null;
  try {
    const auth = await getAuth(req);
    if (auth) {
      userId = auth.sub;
      const rows = await sql`SELECT full_name, email, phone FROM users WHERE id = ${auth.sub}`;
      if (rows.length) {
        name = (rows[0].full_name as string | null)?.trim() || name;
        email = (rows[0].email as string | null) || email;
        phone = (rows[0].phone as string | null) || phone;
      }
    }
  } catch (e) {
    console.error("[enquiries] optional auth lookup failed:", e);
  }

  await sql`
    INSERT INTO enquiries (source, user_id, name, email, phone, subject, message)
    VALUES (${source}, ${userId}, ${name}, ${email}, ${phone}, ${subject}, ${message})
  `;

  // Nothing about the stored row is echoed back: the caller may be anonymous and has no
  // business holding an enquiry id.
  return json({ ok: true });
});
