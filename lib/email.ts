/**
 * Email channel via Resend's REST API (no SDK dependency — plain fetch).
 * No-ops if RESEND_API_KEY / RESEND_FROM aren't set, so callers never need to guard.
 * Use for high-value, off-app events (bid accepted, top-up confirmed, verification result).
 */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
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
