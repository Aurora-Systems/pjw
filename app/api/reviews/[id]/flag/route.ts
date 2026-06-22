import type { NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";
import { parseBody } from "@/lib/validate";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

const flagSchema = z.object({ reason: z.string().trim().min(3).max(500) });

/** POST /api/reviews/:id/flag — the subject of a review flags it for moderator review. */
export const POST = safe(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireAuth(req);
  const { id } = await params;
  const body = await parseBody(req, flagSchema);

  // Only the person the review is about can flag it.
  const rows = await sql`
    UPDATE reviews SET flagged = true, flag_reason = ${body.reason}
    WHERE id = ${id} AND subject_id = ${auth.sub}
    RETURNING id
  `;
  if (rows.length === 0) return error("Review not found", 404);
  return json({ ok: true });
});
