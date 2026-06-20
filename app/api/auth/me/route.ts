import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

export const GET = safe(async (req: NextRequest) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);

  const rows = await sql`
    SELECT u.id, u.phone, u.email, u.full_name, u.role, u.account_type, u.avatar_url, u.city,
           u.id_verified, u.phone_verified, u.client_rating, u.client_reviews_count,
           COALESCE(p.onboarded, false) AS provider_onboarded
    FROM users u
    LEFT JOIN provider_profiles p ON p.user_id = u.id
    WHERE u.id = ${auth.sub}
  `;
  if (rows.length === 0) return error("User not found", 404);
  return json({ user: rows[0] });
});
