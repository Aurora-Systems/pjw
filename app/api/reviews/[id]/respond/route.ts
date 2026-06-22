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

const respondSchema = z.object({ response: z.string().trim().min(1).max(1000) });

/** POST /api/reviews/:id/respond — the reviewed party posts a public right-of-reply. */
export const POST = safe(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireAuth(req);
  const { id } = await params;
  const body = await parseBody(req, respondSchema);

  const rows = await sql`
    UPDATE reviews SET provider_response = ${body.response}, responded_at = now()
    WHERE id = ${id} AND subject_id = ${auth.sub}
    RETURNING id
  `;
  if (rows.length === 0) return error("Review not found", 404);
  return json({ ok: true });
});
