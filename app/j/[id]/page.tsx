import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ShareButton from "../../components/ShareButton";
import { jobSharePath, jobShareText } from "../../lib/share";
import { budgetLabel, getPublicJob } from "@/lib/publicJob";
import JobCta from "./JobCta";

/**
 * /j/:id — the page a shared job link opens. Public, so a friend on WhatsApp can read the job
 * without an account; see lib/publicJob.ts for what is deliberately left out (poster identity,
 * street address, contact details).
 */

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const job = await getPublicJob(id);
  if (!job) return { title: "Job not found", robots: { index: false } };
  const budget = budgetLabel(job);
  const description =
    [budget && `Budget ${budget}`, job.area, job.category].filter(Boolean).join(" · ") +
    (job.status === "open" ? ". Make an offer on PocketJobs." : ". This job is no longer taking offers.");
  return {
    title: job.title,
    description,
    // Reachable through share links only: these are people's jobs, not landing pages.
    robots: { index: false, follow: false },
    openGraph: { title: job.title, description, type: "website", url: jobSharePath(job.id), siteName: "PocketJobs" },
    twitter: { card: "summary_large_image", title: job.title, description },
  };
}

function postedAgo(iso: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return mins < 1 ? "Posted just now" : `Posted ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Posted ${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `Posted ${days}d ago`;
  return `Posted ${new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-pj-slate-400">{label}</div>
      <div className="mt-0.5 text-[15px] text-pj-slate-900">{children}</div>
    </div>
  );
}

export default async function PublicJobPage({ params }: Props) {
  const { id } = await params;
  const job = await getPublicJob(id);
  if (!job) notFound();

  const budget = budgetLabel(job);
  const open = job.status === "open" && job.hired_count < job.workers_needed;
  const multi = job.workers_needed > 1;
  const titleSize = job.title.length <= 28 ? "text-4xl sm:text-5xl" : job.title.length <= 60 ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl";

  return (
    <div className="flex flex-col min-h-full">
      <Navbar />
      <main className="flex-1 bg-pj-slate-50 pt-28 pb-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <article className="rounded-3xl bg-white border border-pj-slate-100 shadow-sm p-6 sm:p-10">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex flex-wrap items-center gap-2">
                {job.category && (
                  <span className="rounded-full bg-pj-blue-50 px-3 py-1 text-xs font-semibold text-pj-blue-700">
                    {job.category}
                  </span>
                )}
                {!open && (
                  <span className="rounded-full bg-pj-slate-100 px-3 py-1 text-xs font-semibold text-pj-slate-600">
                    No longer taking offers
                  </span>
                )}
              </div>
              <span className="text-xs text-pj-slate-400 whitespace-nowrap">{postedAgo(job.created_at)}</span>
            </div>

            <h1 className={`${titleSize} font-extrabold tracking-tight leading-[1.05] text-pj-slate-900 break-words`}>
              {job.title}
            </h1>

            {job.description && (
              <p className="mt-4 text-base leading-relaxed text-pj-slate-500 whitespace-pre-line break-words">
                {job.description}
              </p>
            )}

            <div className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5">
              {job.area && <Fact label="Location">{job.area}</Fact>}
              {job.when_text && <Fact label="When">{job.when_text}</Fact>}
              {multi && (
                <Fact label="People needed">
                  {job.workers_needed} ({Math.max(0, job.workers_needed - job.hired_count)} still open)
                </Fact>
              )}
              <Fact label="Offers so far">{job.offers === 0 ? "None yet" : job.offers}</Fact>
            </div>

            <div className="mt-8 rounded-3xl bg-pj-slate-100 px-6 py-7 text-center">
              <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-pj-slate-500">Job budget</div>
              <div className="mt-1 text-5xl font-extrabold tracking-tight text-pj-slate-900">{budget ?? "Open to offers"}</div>
              {budget && <div className="mt-2 text-sm text-pj-slate-500">Providers can offer above or below this.</div>}
            </div>

            {job.photos.length > 0 && (
              <div className="mt-8">
                <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-pj-slate-400 mb-3">Photos</div>
                <div className="flex flex-wrap gap-3">
                  {job.photos.map((src, i) => (
                    <a key={`${src}-${i}`} href={src} target="_blank" rel="noopener noreferrer" aria-label={`Open photo ${i + 1}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="w-24 h-24 rounded-2xl object-cover border border-pj-slate-100" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <JobCta jobId={job.id} open={open} />

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-pj-slate-100 pt-5">
              <p className="text-xs text-pj-slate-400 leading-relaxed">
                The exact address is only shared with the provider who gets the job.
              </p>
              <ShareButton
                path={jobSharePath(job.id)}
                title={job.title}
                text={jobShareText({ title: job.title, budget, area: job.area })}
                size="sm"
              />
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
