import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // In production, use NEXT_PUBLIC_SITE_URL if set, otherwise fall back to default
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  // only follow if production
  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production";

  return {
    rules: {
      userAgent: "*",
      allow: isProduction ? "/" : undefined,
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
