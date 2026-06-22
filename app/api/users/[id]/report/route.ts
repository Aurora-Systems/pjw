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

const reportSchema = z.object({
  reason: z.string().trim().min(3).max(1000),
  context: z.string().trim().max(500).nullish(),
});

/** POST /api/users/:id/report — report another user to admins. */
export const POST = safe(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireAuth(req);
  const { id } = await params;
  if (id === auth.sub) return error("You can't report yourself", 400);
  const body = await parseBody(req, reportSchema);
  await sql`
    INSERT INTO user_reports (reporter_id, reported_id, reason, context)
    VALUES (${auth.sub}, ${id}, ${body.reason}, ${body.context ?? null})
  `;
  return json({ ok: true }, { status: 201 });
});
