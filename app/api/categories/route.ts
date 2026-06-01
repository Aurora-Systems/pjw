import { sql } from "@/lib/db";
import { json, preflight } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

export async function GET() {
  const categories = await sql`
    SELECT id, name, slug, icon FROM categories ORDER BY sort_order ASC
  `;
  return json({ categories });
}
