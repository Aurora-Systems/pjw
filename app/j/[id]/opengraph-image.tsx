import { ImageResponse } from "next/og";
import { budgetLabel, getPublicJob } from "@/lib/publicJob";
import { POPPINS_500, POPPINS_800 } from "@/lib/og-fonts";

/**
 * The preview card WhatsApp, Facebook and X show for a shared job link: the job title large,
 * the town, and the budget in its own block, in the same style as the job page itself.
 */

export const runtime = "nodejs";
export const alt = "A job on PocketJobs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getPublicJob(id);
  const title = job?.title ?? "Find work on PocketJobs";
  const budget = job ? budgetLabel(job) : null;
  const titleSize = title.length <= 24 ? 92 : title.length <= 48 ? 74 : 58;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#2563EB", padding: 36, fontFamily: "Poppins" }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "#FFFFFF",
            borderRadius: 36,
            padding: "52px 60px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", fontSize: 34, fontWeight: 800, color: "#0F172A" }}>
              Pocket<span style={{ color: "#2563EB" }}>Jobs</span>
            </div>
            {job?.category && (
              <div
                style={{
                  display: "flex",
                  fontSize: 24,
                  fontWeight: 500,
                  color: "#1D4ED8",
                  background: "#EFF6FF",
                  borderRadius: 999,
                  padding: "8px 22px",
                }}
              >
                {job.category}
              </div>
            )}
          </div>

          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 48, marginTop: 24 }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  fontSize: titleSize,
                  fontWeight: 800,
                  color: "#0F172A",
                  lineHeight: 1.04,
                  letterSpacing: -2,
                }}
              >
                {title.length > 80 ? `${title.slice(0, 78)}…` : title}
              </div>
              {job?.area && (
                <div style={{ display: "flex", flexDirection: "column", marginTop: 26 }}>
                  <div style={{ display: "flex", fontSize: 20, fontWeight: 500, color: "#94A3B8", letterSpacing: 2 }}>
                    LOCATION
                  </div>
                  <div style={{ display: "flex", fontSize: 32, fontWeight: 500, color: "#334155" }}>{job.area}</div>
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: 330,
                padding: "34px 20px",
                background: "#F1F5F9",
                borderRadius: 32,
              }}
            >
              <div style={{ display: "flex", fontSize: 20, fontWeight: 500, color: "#64748B", letterSpacing: 2 }}>
                JOB BUDGET
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: budget && budget.length > 9 ? 50 : 76,
                  fontWeight: 800,
                  color: "#0F172A",
                  letterSpacing: -2,
                }}
              >
                {budget ?? "Make an offer"}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Poppins", data: POPPINS_500, weight: 500, style: "normal" },
        { name: "Poppins", data: POPPINS_800, weight: 800, style: "normal" },
      ],
    }
  );
}
