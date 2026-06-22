import type { NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";
import { parseBody } from "@/lib/validate";
import { notify } from "@/lib/notify";
import { isOurUploadUrl } from "@/lib/r2";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** GET /api/jobs — the signed-in customer's posted jobs (with bid counts). */
export const GET = safe(async (req: NextRequest) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);

  const jobs = await sql`
    SELECT j.*, COUNT(b.id)::int AS bid_count
    FROM jobs j LEFT JOIN bids b ON b.job_id = j.id
    WHERE j.customer_id = ${auth.sub}
    GROUP BY j.id
    ORDER BY j.created_at DESC
  `;
  return json({ jobs });
});

const jobSchema = z.object({
  title: z.string().trim().min(1).max(200),
  category: z.string().trim().max(80).nullish(),
  description: z.string().trim().max(5000).nullish(),
  budget_min: z.number().finite().nonnegative().max(1_000_000).nullish(),
  budget_max: z.number().finite().nonnegative().max(1_000_000).nullish(),
  when_text: z.string().trim().max(200).nullish(),
  location: z.string().trim().max(200).nullish(),
  photos: z.array(z.string()).max(12).nullish(),
});

/** POST /api/jobs — post a new job (open for bids). */
export const POST = safe(async (req: NextRequest) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);

  const body = await parseBody(req, jobSchema);
  const photos = Array.isArray(body.photos) ? body.photos.filter(isOurUploadUrl).slice(0, 6) : null;

  const rows = await sql`
    INSERT INTO jobs (customer_id, title, category, description, budget_min, budget_max, when_text, location, photos)
    VALUES (${auth.sub}, ${body.title}, ${body.category ?? null}, ${body.description ?? null},
            ${body.budget_min ?? null}, ${body.budget_max ?? null}, ${body.when_text ?? null}, ${body.location ?? null},
            ${photos})
    RETURNING *
  `;
  const job = rows[0];

  // Liquidity loop: tell available, in-category providers (who can take work) about the new job.
  if (job.category) {
    try {
      const providers = await sql`
        SELECT user_id FROM provider_profiles
        WHERE primary_category = ${job.category} AND available = true AND balance > 0
          AND user_id <> ${auth.sub}
        LIMIT 25
      `;
      await Promise.all(
        providers.map((p) =>
          notify(p.user_id, "jobs", "New job near you", `New ${job.category} job: "${job.title}"`, {
            entity: "open-job",
            id: job.id,
          })
        )
      );
    } catch (e) {
      console.error("[jobs] fan-out failed:", e);
    }
  }
  return json({ job }, { status: 201 });
});
