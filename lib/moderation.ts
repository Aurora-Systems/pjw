/**
 * Heuristic detector for attempts to move a deal off-platform (which kills the dispute
 * trail and platform revenue). We don't block the message — we flag it for review, mask it
 * for the recipient, and the client warns the sender. Deliberately lenient to avoid false
 * positives.
 */
const PHONE = /(?:\+?\d[\s().-]?){9,}/; // 9+ digits with common separators
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const KEYWORDS = /\b(whats\s?app|wsp|telegram|my number|call me|text me|ecocash|cash\s?app|off\s?app|outside the app)\b/i;

export function hasContactInfo(text: string): boolean {
  return PHONE.test(text) || EMAIL.test(text) || KEYWORDS.test(text);
}

/* ─────────────────────────── Masking ───────────────────────────
   Global (/g) copies of the patterns above. The single-shot versions must stay
   non-global: a /g regex carries lastIndex between .test() calls, so reusing one
   for detection would return false on every other call. */
const PHONE_G = /(?:\+?\d[\s().-]?){9,}/g;
const EMAIL_G = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
/** A bare run of 7+ digits — catches "0772123456" written without separators. */
const DIGITS_G = /\d{7,}/g;

/**
 * Replace contact details in `text` with a visible placeholder.
 *
 * Applied ON READ, never on write: the stored row keeps the original wording so a dispute
 * or moderation review can still see exactly what was said. Masking output is deliberately
 * obvious ("[number hidden]") rather than silent deletion — the reader should understand a
 * rule applied, not think the sender typed nonsense.
 *
 * Keeps the last 2 digits of a phone number so a legitimate reference ("...ends 42") is
 * still usable to the reader without handing over a dialable number.
 */
export function maskContactInfo(text: string): string {
  if (!text) return text;
  return text
    .replace(EMAIL_G, "[email hidden]")
    .replace(PHONE_G, (m) => {
      // The pattern lets each digit carry a trailing separator, so a match can swallow the
      // space AFTER the number ("456 instead" -> "...]instead"). Put any trailing
      // punctuation/whitespace back rather than gluing the next word on.
      const tail = m.match(/[\s().-]+$/)?.[0] ?? "";
      const digits = m.replace(/\D/g, "");
      return digits.length >= 9 ? `[number hidden ••${digits.slice(-2)}]${tail}` : m;
    })
    .replace(DIGITS_G, (m) => `[number hidden ••${m.slice(-2)}]`);
}
