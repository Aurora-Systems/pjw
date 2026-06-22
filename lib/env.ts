/**
 * Startup env validation. DATABASE_URL and JWT_SECRET already fail-fast at import in their
 * modules; this surfaces the rest as grouped warnings so a deploy missing (say) the Pesepay
 * or R2 keys is obvious in the logs instead of breaking on first use.
 */
const GROUPS: Record<string, string[]> = {
  payments: ["PESEPAY_INTEGRATION_KEY", "PESEPAY_ENCRYPTION_KEY"],
  storage: ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"],
  kyc: ["DIDIT_API_KEY"],
  push: ["ONESIGNAL_APP_ID", "ONESIGNAL_REST_API_KEY"],
  auth: ["NEON_AUTH_BASE_URL"],
};

export function validateEnv(): void {
  for (const [group, keys] of Object.entries(GROUPS)) {
    const missing = keys.filter((k) => !process.env[k]);
    if (missing.length === keys.length) {
      console.warn(`[env] ${group}: not configured (${keys.join(", ")}) — related features are disabled.`);
    } else if (missing.length > 0) {
      console.error(`[env] ${group}: PARTIALLY configured — missing ${missing.join(", ")}. This will fail at runtime.`);
    }
  }
}
