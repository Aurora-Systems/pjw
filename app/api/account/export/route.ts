import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { preflight, safe } from "@/lib/http";
import { buildUserExport } from "@/lib/dataExport";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * GET /api/account/export — download a machine-readable copy of your own data.
 * Used by the web "Download my data" button (Right to Access / Portability).
 */
export const GET = safe(async (req: NextRequest) => {
  const auth = await requireAuth(req);
  await rateLimit(`export:${auth.sub}`, 5, 3600); // building this is heavy; 5/hour is plenty

  const data = await buildUserExport(auth.sub);
  const body = JSON.stringify(data, null, 2);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="pocketjobs-my-data.json"`,
      "Access-Control-Allow-Origin": process.env.CORS_ALLOW_ORIGIN || "*",
      "Cache-Control": "no-store",
    },
  });
});
