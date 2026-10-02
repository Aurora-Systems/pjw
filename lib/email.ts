/**
 * Email channel via Resend's REST API (no SDK dependency — plain fetch).
 * No-ops if RESEND_API_KEY / RESEND_FROM aren't set, so callers never need to guard.
 * Use for high-value, off-app events (bid accepted, top-up confirmed, verification result).
 */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

/** Escape untrusted values before interpolating them into email HTML. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * "Your offer was accepted" — sent to the provider the moment a customer hires them.
 * Links straight to the shared job page where both parties track the work.
 */
export function bidAcceptedEmail(p: {
  providerName: string;
  customerName: string;
  jobTitle: string;
  price: string;
  location: string | null;
  whenText: string | null;
  bookingId: string;
}): string {
  const base = process.env.APP_PUBLIC_URL || "https://pocketjobs.co";
  const url = `${base}/bookings/${p.bookingId}`;
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 0;color:#475569;font-size:14px">${esc(label)}</td>
         <td style="padding:6px 0;color:#0F172A;font-size:14px;font-weight:600;text-align:right">${esc(value)}</td></tr>`;

  return `<!doctype html><html><body style="margin:0;background:#F8FAFC;font-family:system-ui,-apple-system,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="font-size:20px;font-weight:800;color:#0F172A;margin-bottom:20px">
      Pocket<span style="color:#2563EB">Jobs</span>
    </div>
    <div style="background:#fff;border:1px solid #E2E8F0;border-radius:16px;padding:28px">
      <div style="display:inline-block;background:#EFF6FF;color:#2563EB;font-size:12px;font-weight:700;padding:6px 12px;border-radius:999px;margin-bottom:16px">
        OFFER ACCEPTED
      </div>
      <h1 style="margin:0 0 8px;font-size:24px;color:#0F172A">You got the job, ${esc(p.providerName.split(" ")[0])}!</h1>
      <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6">
        ${esc(p.customerName)} accepted your offer for <strong>${esc(p.jobTitle)}</strong>.
      </p>
      <table style="width:100%;border-collapse:collapse;border-top:1px solid #E2E8F0;border-bottom:1px solid #E2E8F0;margin-bottom:22px">
        ${row("Your price", `$${p.price}`)}
        ${p.whenText ? row("When", p.whenText) : ""}
        ${p.location ? row("Location", p.location) : ""}
      </table>
      <a href="${url}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:12px">
        View job &amp; update progress
      </a>
      <p style="margin:22px 0 0;color:#475569;font-size:13px;line-height:1.6">
        Keep the client updated from that page — mark when you're on the way, when you arrive and when
        the work is done. You collect <strong>$${esc(p.price)} in cash</strong> on completion.
      </p>
    </div>
    <p style="color:#94A3B8;font-size:12px;text-align:center;margin-top:20px">
      PocketJobs · Harare, Zimbabwe
    </p>
  </div></body></html>`;
}

/** Escape, then keep the author's line breaks — admins type replies as plain text. */
function escMultiline(s: string): string {
  return esc(s).replace(/\r\n|\r|\n/g, "<br>");
}

/**
 * "We've replied to your enquiry" — sent to whoever wrote in (support form on the web,
 * or in-app support) when an admin answers them from the console.
 *
 * The sender address is transactional and is not monitored for inbound mail, so the
 * footer points back at the contact form rather than promising that a reply lands
 * with us — telling someone to "just reply" would silently drop their follow-up.
 */
export function enquiryReplyEmail(p: {
  /** Who wrote in — used for the greeting. */
  name: string;
  /** Their original subject, if they gave one. */
  subject: string | null;
  /** Their original message, quoted back so the reply makes sense on its own. */
  originalMessage: string;
  /** What the admin typed. */
  reply: string;
  /** The admin's name, if we have it ("— Tinashe, PocketJobs Support"). */
  adminName?: string | null;
}): string {
  const base = process.env.APP_PUBLIC_URL || "https://pocketjobs.co";
  const contactUrl = `${base}/company/contact`;
  const firstName = p.name.trim().split(" ")[0] || "there";

  return `<!doctype html><html><body style="margin:0;background:#F8FAFC;font-family:system-ui,-apple-system,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="font-size:20px;font-weight:800;color:#0F172A;margin-bottom:20px">
      Pocket<span style="color:#2563EB">Jobs</span>
    </div>
    <div style="background:#fff;border:1px solid #E2E8F0;border-radius:16px;padding:28px">
      <div style="display:inline-block;background:#EFF6FF;color:#2563EB;font-size:12px;font-weight:700;padding:6px 12px;border-radius:999px;margin-bottom:16px">
        SUPPORT REPLY
      </div>
      <h1 style="margin:0 0 8px;font-size:24px;color:#0F172A">Hi ${esc(firstName)}, here's our reply</h1>
      <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6">
        Thanks for getting in touch${p.subject ? ` about <strong>${esc(p.subject)}</strong>` : ""}.
      </p>
      <div style="color:#0F172A;font-size:15px;line-height:1.7;padding-bottom:22px">
        ${escMultiline(p.reply)}
      </div>
      ${
        p.adminName
          ? `<p style="margin:0 0 22px;color:#475569;font-size:14px">— ${esc(p.adminName)}, PocketJobs Support</p>`
          : `<p style="margin:0 0 22px;color:#475569;font-size:14px">— PocketJobs Support</p>`
      }
      <div style="border-top:1px solid #E2E8F0;padding-top:18px;margin-bottom:22px">
        <div style="color:#94A3B8;font-size:12px;font-weight:700;letter-spacing:.04em;margin-bottom:8px">
          YOUR MESSAGE
        </div>
        <div style="background:#F8FAFC;border-left:3px solid #E2E8F0;border-radius:0 8px 8px 0;padding:12px 14px;color:#475569;font-size:14px;line-height:1.6">
          ${escMultiline(p.originalMessage)}
        </div>
      </div>
      <a href="${contactUrl}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:12px">
        Send us another message
      </a>
      <p style="margin:22px 0 0;color:#475569;font-size:13px;line-height:1.6">
        This address doesn't take replies — use the link above and we'll pick it up from there.
      </p>
    </div>
    <p style="color:#94A3B8;font-size:12px;text-align:center;margin-top:20px">
      PocketJobs · Harare, Zimbabwe
    </p>
  </div></body></html>`;
}

/**
 * Admins write these messages like letters and habitually open with a "Subject: …" line.
 * Lift that line out so it becomes the real email subject instead of sitting in the body.
 * Returns the message unchanged (subject: null) when there is no such first line.
 */
export function splitSubjectLine(message: string): { subject: string | null; body: string } {
  const m = message.match(/^\s*subject\s*:\s*(.+?)\s*(?:\r?\n|$)/i);
  if (!m) return { subject: null, body: message.trim() };
  return { subject: m[1].trim() || null, body: message.slice(m[0].length).trim() };
}

/**
 * A message an admin wrote to one user — sent when support takes down their job post.
 *
 * The admin's text goes out verbatim: they write their own greeting and sign-off, so this
 * template adds neither. `dir="auto"` lets a message written in Arabic (posts have come in
 * that way) render right-to-left instead of as a jumbled left-aligned block.
 */
export function adminMessageEmail(p: {
  /** What the admin typed, minus any "Subject:" line (see splitSubjectLine). */
  message: string;
  /** The job this is about, shown as context above the message. */
  jobTitle?: string | null;
}): string {
  const base = process.env.APP_PUBLIC_URL || "https://pocketjobs.co";

  return `<!doctype html><html><body style="margin:0;background:#F8FAFC;font-family:system-ui,-apple-system,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="font-size:20px;font-weight:800;color:#0F172A;margin-bottom:20px">
      Pocket<span style="color:#2563EB">Jobs</span>
    </div>
    <div style="background:#fff;border:1px solid #E2E8F0;border-radius:16px;padding:28px">
      <div style="display:inline-block;background:#EFF6FF;color:#2563EB;font-size:12px;font-weight:700;padding:6px 12px;border-radius:999px;margin-bottom:16px">
        MESSAGE FROM POCKETJOBS SUPPORT
      </div>
      ${
        p.jobTitle
          ? `<p style="margin:0 0 18px;color:#475569;font-size:14px">About your job post: <strong style="color:#0F172A">${esc(p.jobTitle)}</strong></p>`
          : ""
      }
      <div dir="auto" style="color:#0F172A;font-size:15px;line-height:1.7;padding-bottom:22px">
        ${escMultiline(p.message)}
      </div>
      <a href="${base}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:12px">
        Open PocketJobs
      </a>
      <p style="margin:22px 0 0;color:#475569;font-size:13px;line-height:1.6">
        This address doesn't take replies. To get back to us, use the contact page at
        <a href="${base}/company/contact" style="color:#2563EB">pocketjobs.co/company/contact</a>.
      </p>
    </div>
    <p style="color:#94A3B8;font-size:12px;text-align:center;margin-top:20px">
      PocketJobs · Harare, Zimbabwe
    </p>
  </div></body></html>`;
}

export interface EmailAttachment {
  /** File name shown to the recipient, e.g. "pocketjobs-data.json". */
  filename: string;
  /** Raw file contents (encoded to base64 for the API). */
  content: string;
}

/**
 * Send an email. Returns true only if it was actually accepted by Resend — callers that
 * promise the user something ("we've emailed it") must check this rather than assume.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  attachments?: EmailAttachment[]
): Promise<boolean> {
  if (!isEmailConfigured()) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM,
        to,
        subject,
        html,
        ...(attachments?.length
          ? {
              attachments: attachments.map((a) => ({
                filename: a.filename,
                content: Buffer.from(a.content, "utf8").toString("base64"),
              })),
            }
          : {}),
      }),
    });
    if (!res.ok) {
      console.error("[email] send failed:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] error:", e);
    return false;
  }
}
