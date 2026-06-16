import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth, signToken } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * POST /api/account/become-provider — upgrade the signed-in user to a provider.
 * Creates their provider_profiles row (onboarded = false, so the app routes them
 * into provider onboarding) and returns a FRESH token carrying the new role —
 * the client must replace its stored token with it.
 */
export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);

  const existing = await sql`SELECT id, role FROM users WHERE id = ${auth.sub}`;
  if (existing.length === 0) return error("User not found", 404);
  const role = existing[0].role as string;

  if (role === "admin") return error("Admins cannot switch roles", 403);

  if (role !== "provider") {
    await sql`UPDATE users SET role = 'provider' WHERE id = ${auth.sub}`;
    await sql`INSERT INTO provider_profiles (user_id) VALUES (${auth.sub}) ON CONFLICT DO NOTHING`;
  } else {
    // Idempotent: already a provider, just make sure the profile row exists.
    await sql`INSERT INTO provider_profiles (user_id) VALUES (${auth.sub}) ON CONFLICT DO NOTHING`;
  }

  const rows = await sql`
    SELECT u.id, u.phone, u.email, u.full_name, u.role, u.account_type, u.avatar_url, u.city,
           u.id_verified, u.phone_verified,
           COALESCE(p.onboarded, false) AS provider_onboarded
    FROM users u
    LEFT JOIN provider_profiles p ON p.user_id = u.id
    WHERE u.id = ${auth.sub}
  `;
  const user = rows[0];
  const token = await signToken({ sub: user.id, role: user.role, name: user.full_name });
  return json({ token, user });
}
