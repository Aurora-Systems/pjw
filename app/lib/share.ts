/**
 * Share-link helpers, kept out of the ShareButton client component so server pages (the
 * public job page and its metadata) can call them too.
 */

export function jobSharePath(id: string) {
  return `/j/${id}`;
}

/** "$120", "$100–$150", or null when there is no budget. Takes the API's string amounts. */
export function budgetText(min: string | number | null | undefined, max: string | number | null | undefined) {
  const f = (v: string | number | null | undefined) =>
    v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : `$${Number(v)}`;
  const lo = f(min);
  const hi = f(max);
  if (lo && hi) return lo === hi ? lo : `${lo}–${hi}`;
  return lo ?? hi;
}

/** The text that travels with the link: "Paint two bedrooms · $120 · Harare". */
export function jobShareText(job: { title: string; budget?: string | null; area?: string | null }) {
  return [job.title, job.budget, job.area].filter(Boolean).join(" · ") + " — on PocketJobs";
}
