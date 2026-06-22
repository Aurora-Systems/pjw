import type { MetadataRoute } from "next";

const BASE = process.env.APP_PUBLIC_URL || "https://pocketjobs.co";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/app/", "/api/", "/auth/", "/verify/", "/payment/"] }],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
