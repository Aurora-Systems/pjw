/**
 * Direct Google OAuth 2.0 (authorization-code flow), done server-side so we stay
 * in control of the session: we exchange the code, read the verified id_token,
 * map to a local user, and issue our own app JWT. No Neon Auth round-trip needed.
 */

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function redirectUri(): string {
  const base = process.env.APP_PUBLIC_URL || "http://localhost:3000";
  return `${base}/api/auth/google/callback`;
}

/** Build the Google consent URL. `state` is opaque (we round-trip role/platform/nonce). */
export function consentUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export interface GoogleIdentity {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

/** Exchange an authorization code for the user's verified Google identity. */
export async function exchangeCode(code: string): Promise<GoogleIdentity> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID as string,
      client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.id_token) {
    throw new Error(data?.error_description || data?.error || "Google token exchange failed");
  }
  // id_token comes straight from Google's token endpoint over TLS using our secret,
  // so decoding the payload is sufficient (no separate signature check needed here).
  const payload = JSON.parse(Buffer.from(data.id_token.split(".")[1], "base64").toString("utf8"));
  return {
    sub: payload.sub,
    email: payload.email,
    email_verified: Boolean(payload.email_verified),
    name: payload.name,
    picture: payload.picture,
  };
}
