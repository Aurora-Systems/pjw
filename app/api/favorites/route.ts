import type { NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, preflight, safe } from "@/lib/http";
import { parseBody } from "@/lib/validate";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** GET /api/favorites — the user's saved providers (with profile summary for rebooking). */
export const GET = safe(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  const rows = await sql`
    SELECT u.id, u.full_name, u.avatar_url,
           (u.didit_status ILIKE 'approved') AS didit_verified,
           -- Public trust signal only (the name the mobile app reads) — never the raw work gate.
           (u.didit_status ILIKE 'approved') AS id_verified,
           pp.headline, pp.primary_category, pp.hourly_rate, pp.rating, pp.reviews_count
    FROM favorites f
    JOIN users u ON u.id = f.provider_id
    LEFT JOIN provider_profiles pp ON pp.user_id = u.id
    WHERE f.user_id = ${auth.sub}
      AND u.deleted_at IS NULL
    ORDER BY f.created_at DESC
  `;
  return json({ favorites: rows });
});

const favSchema = z.object({ provider_id: z.string().uuid() });

/** POST /api/favorites — save a provider. */
export const POST = safe(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  const body = await parseBody(req, favSchema);
  await sql`
    INSERT INTO favorites (user_id, provider_id) VALUES (${auth.sub}, ${body.provider_id})
    ON CONFLICT DO NOTHING
  `;
  return json({ ok: true, favorited: true });
});
