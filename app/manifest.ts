import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PocketJobs",
    short_name: "PocketJobs",
    description: "Hire trusted local service providers across Zimbabwe.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563EB",
    icons: [{ src: "/pocket_jobs_logo.png", sizes: "any", type: "image/png" }],
  };
}
