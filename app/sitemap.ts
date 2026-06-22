import type { MetadataRoute } from "next";

const BASE = process.env.APP_PUBLIC_URL || "https://pocketjobs.co";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/login",
    "/signup",
    "/legal/privacy",
    "/legal/terms",
    "/company/about",
    "/company/contact",
    "/resources/support",
  ];
  return routes.map((r) => ({
    url: `${BASE}${r}`,
    changeFrequency: "weekly" as const,
    priority: r === "" ? 1 : 0.6,
  }));
}
