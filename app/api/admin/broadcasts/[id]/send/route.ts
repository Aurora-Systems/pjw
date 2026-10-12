import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";
import { sendNextChunk } from "@/lib/broadcast";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * POST /api/admin/broadcasts/:id/send — send the next chunk of a mass email and report
 * progress. The console calls this in a loop until `progress.remaining` is 0; calling it on
 * a paused broadcast resumes it.
 */
export const POST = safe(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireRole(req, "admin");
  const { id } = await params;
  const result = await sendNextChunk(id);
  if (!result) return error("Broadcast not found", 404);
  return json(result);
});
