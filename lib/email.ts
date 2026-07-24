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
 * "Your bid was accepted" — sent to the provider the moment a customer hires them.
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
        BID ACCEPTED
      </div>
      <h1 style="margin:0 0 8px;font-size:24px;color:#0F172A">You got the job, ${esc(p.providerName.split(" ")[0])}!</h1>
      <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6">
        ${esc(p.customerName)} accepted your bid for <strong>${esc(p.jobTitle)}</strong>.
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
