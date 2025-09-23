import { MetadataRoute } from "next";
import { getAllPageSlugs } from "@/lib/contentful/fetchers/pageCms";
import { SUPPORTED_LOCALES } from "@/lib/locale-types";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const sitemap: MetadataRoute.Sitemap = [];

  try {
    // Generate sitemap entries for all supported locales
    for (const locale of Object.keys(
      SUPPORTED_LOCALES
    ) as (keyof typeof SUPPORTED_LOCALES)[]) {
      try {
        const slugs = await getAllPageSlugs(locale);

        // Filter out 404 page
        const filteredSlugs = slugs.filter((slug) => slug !== "404");

        for (const slug of filteredSlugs) {
          const url = slug === "home" ? `${baseUrl}/` : `${baseUrl}/${slug}`;

          sitemap.push({
            url,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: slug === "home" ? 1 : 0.8,
          });
        }
      } catch (error) {
        console.warn(`Failed to generate sitemap for locale ${locale}:`, error);
      }
    }
  } catch (error) {
    console.error("Failed to generate sitemap:", error);
  }

  // Ensure we always have at least a home page entry
  if (sitemap.length === 0) {
    sitemap.push({
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    });
  }

  return sitemap;
}
