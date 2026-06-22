/**
 * Heuristic detector for attempts to move a deal off-platform (which kills the dispute
 * trail and platform revenue). We don't block the message — we flag it for review and the
 * client can warn the user. Deliberately lenient to avoid false positives.
 */
const PHONE = /(?:\+?\d[\s().-]?){9,}/; // 9+ digits with common separators
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const KEYWORDS = /\b(whats\s?app|wsp|telegram|my number|call me|text me|ecocash|cash\s?app|off\s?app|outside the app)\b/i;

export function hasContactInfo(text: string): boolean {
  return PHONE.test(text) || EMAIL.test(text) || KEYWORDS.test(text);
}
