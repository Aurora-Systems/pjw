import type { NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";
import { parseBody } from "@/lib/validate";
import { NOTIFICATION_TYPES } from "@/lib/notify";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** GET /api/notifications/preferences — current prefs (defaults if none saved). */
export const GET = safe(async (req: NextRequest) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  const rows = await sql`SELECT push_enabled, muted_types FROM notification_prefs WHERE user_id = ${auth.sub}`;
  const prefs = rows[0] ?? { push_enabled: true, muted_types: [] };
  return json({ preferences: prefs, types: NOTIFICATION_TYPES });
});

const prefsSchema = z.object({
  push_enabled: z.boolean().optional(),
  muted_types: z.array(z.enum(NOTIFICATION_TYPES)).optional(),
});

/** PATCH /api/notifications/preferences — update push toggle and/or muted types. */
export const PATCH = safe(async (req: NextRequest) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  const body = await parseBody(req, prefsSchema);

  const rows = await sql`
    INSERT INTO notification_prefs (user_id, push_enabled, muted_types, updated_at)
    VALUES (${auth.sub}, ${body.push_enabled ?? true}, ${body.muted_types ?? []}, now())
    ON CONFLICT (user_id) DO UPDATE SET
      push_enabled = COALESCE(${body.push_enabled ?? null}, notification_prefs.push_enabled),
      muted_types  = COALESCE(${body.muted_types ?? null}, notification_prefs.muted_types),
      updated_at = now()
    RETURNING push_enabled, muted_types
  `;
  return json({ preferences: rows[0] });
});
