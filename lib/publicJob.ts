import { cache } from "react";
import { sql } from "@/lib/db";
import { maskContactInfo } from "@/lib/moderation";

/**
 * A job as anyone with a share link may see it, without signing in.
 *
 * Shared links reach people outside PocketJobs, so this is deliberately less than the
 * signed-in job view:
 *  - no poster name, photo or rating;
 *  - the town only, never the street address (the hired provider gets that on the booking);
 *  - phone numbers and emails in the description are masked, as they are in chat.
 * A job whose poster was banned or deleted their account is not shown at all.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PublicJob {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  area: string | null;
  when_text: string | null;
  budget_min: number | null;
  budget_max: number | null;
  photos: string[];
  status: "open" | "assigned" | "completed" | "cancelled";
  created_at: string;
  workers_needed: number;
  hired_count: number;
  offers: number;
}

const COUNTRY = /^(zimbabwe|simbabwe|south africa|zambia|botswana|mozambique|malawi)$/i;
const PLUS_CODE = /^[23456789CFGHJMPQRVWX]{4,}\+[23456789CFGHJMPQRVWX]{2,}$/i;

/** "1 Marondera Cres, Marondera, Zimbabwe" -> "Marondera". Null when nothing safe is left. */
export function publicArea(location: string | null | undefined): string | null {
  const parts = (location ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p && !COUNTRY.test(p) && !PLUS_CODE.test(p));
  const town = parts[parts.length - 1];
  // A lone part with a house number is a street address, not a town.
  if (!town || (parts.length === 1 && /\d/.test(town))) return null;
  return town;
}

const num = (v: unknown) => (v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));

/** Cached per request, so the page, its metadata and its preview image share one query. */
export const getPublicJob = cache(async (id: string): Promise<PublicJob | null> => {
  if (!UUID.test(id)) return null;
  const rows = await sql`
    SELECT j.id, j.title, j.description, j.location, j.when_text, j.budget_min, j.budget_max,
           j.photos, j.status, j.created_at,
           COALESCE(j.workers_needed, 1) AS workers_needed, COALESCE(j.hired_count, 0) AS hired_count,
           COALESCE(c.name, j.category) AS category,
           (SELECT count(*) FROM bids b WHERE b.job_id = j.id) AS offers
    FROM jobs j
    JOIN users u ON u.id = j.customer_id
    LEFT JOIN categories c ON c.slug = j.category
    WHERE j.id = ${id} AND u.deleted_at IS NULL
  `;
  const j = rows[0];
  if (!j) return null;
  return {
    id: j.id,
    title: j.title,
    description: j.description ? maskContactInfo(j.description) : null,
    category: j.category ?? null,
    area: publicArea(j.location),
    when_text: j.when_text ?? null,
    budget_min: num(j.budget_min),
    budget_max: num(j.budget_max),
    photos: Array.isArray(j.photos) ? j.photos.filter(Boolean) : [],
    status: j.status,
    created_at: new Date(j.created_at).toISOString(),
    workers_needed: Number(j.workers_needed),
    hired_count: Number(j.hired_count),
    offers: Number(j.offers),
  };
});

const money = (n: number) => `$${Number.isInteger(n) ? n.toLocaleString("en-US") : n.toFixed(2)}`;

/** "$120", "$100–$150", or null when the poster set no budget. */
export function budgetLabel(job: Pick<PublicJob, "budget_min" | "budget_max">): string | null {
  const lo = job.budget_min;
  const hi = job.budget_max;
  if (lo !== null && hi !== null) return lo === hi ? money(lo) : `${money(lo)}–${money(hi)}`;
  if (lo !== null) return money(lo);
  if (hi !== null) return money(hi);
  return null;
}
