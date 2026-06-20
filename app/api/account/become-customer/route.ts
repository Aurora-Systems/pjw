import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth, signToken } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * POST /api/account/become-customer — switch the signed-in provider back to a customer
 * (client) account. Their provider_profiles row is kept, so switching back to provider
 * later doesn't require re-onboarding. Returns a FRESH token carrying the new role —
 * the client must replace its stored token with it.
 */
export const POST = safe(async (req: NextRequest) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);

  const existing = await sql`SELECT id, role FROM users WHERE id = ${auth.sub}`;
  if (existing.length === 0) return error("User not found", 404);
  const role = existing[0].role as string;

  if (role === "admin") return error("Admins cannot switch roles", 403);
  if (role !== "customer") {
    await sql`UPDATE users SET role = 'customer' WHERE id = ${auth.sub}`;
  }

  const rows = await sql`
    SELECT u.id, u.phone, u.email, u.full_name, u.role, u.account_type, u.avatar_url, u.city,
           u.id_verified, u.phone_verified, u.client_rating, u.client_reviews_count,
           COALESCE(p.onboarded, false) AS provider_onboarded
    FROM users u
    LEFT JOIN provider_profiles p ON p.user_id = u.id
    WHERE u.id = ${auth.sub}
  `;
  const user = rows[0];
  const token = await signToken({ sub: user.id, role: user.role, name: user.full_name });
  return json({ token, user });
});
