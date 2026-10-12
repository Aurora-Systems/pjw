import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { json, preflight, safe } from "@/lib/http";
import { audienceCounts } from "@/lib/broadcast";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** GET /api/admin/broadcasts/audience — how many people each audience reaches. */
export const GET = safe(async (req: NextRequest) => {
  await requireRole(req, "admin");
  return json({ audiences: await audienceCounts() });
});
