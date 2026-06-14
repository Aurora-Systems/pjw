import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

/** GET /api/uploads/:id — serve the stored image bytes (public, cacheable). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rows = await sql`SELECT mime, encode(data, 'base64') AS b64 FROM uploads WHERE id = ${id}`;
  if (rows.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }
  const buf = Buffer.from(rows[0].b64 as string, "base64");
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": rows[0].mime as string,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
