import { notFound } from "next/navigation";
import { ModuleRenderer } from "@/ui/components/ModuleRenderer";
import { contentfulModuleRegistry } from "@/lib/contentful/registry";
import {
  getPageBySlug,
  getAllPageSlugs,
} from "@/lib/contentful/fetchers/pageCms";
import { getLocale } from "@/lib/locale";
import { SUPPORTED_LOCALES } from "@/lib/locale-types";
import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/utils/metadata";

export const dynamicParams = true;

export const revalidate = 1800; // revalidate path every 30min

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  
  // Default to "home" when no slug is provided
  const pageSlug = !slug || slug.length === 0 ? "home" : slug.join("/");
  
  return generatePageMetadata(pageSlug, locale);
}

export async function generateStaticParams() {
  const allSlugs: { slug: string[] }[] = [];

  // Generate static params for all supported locales
  for (const locale of Object.keys(
    SUPPORTED_LOCALES
  ) as (keyof typeof SUPPORTED_LOCALES)[]) {
    try {
      const slugs = await getAllPageSlugs(locale);

      // Skip 404 page - it's handled by not-found.tsx
      const filteredSlugs = slugs.filter(slug => slug !== '404');

      filteredSlugs.forEach((slugPath: string) => {
        allSlugs.push({
          slug: slugPath.split("/").filter(Boolean),
        });
      });
    } catch (error) {
      console.warn(`Failed to fetch slugs for locale ${locale}:`, error);
    }
  }

  return allSlugs;
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  
  const locale = await getLocale();
  
  // Default to "home" when no slug is provided
  const pageSlug = !slug || slug.length === 0 ? "home" : slug.join("/");
  
  // Skip 404 page - it's handled by not-found.tsx
  if (pageSlug === '404') {
    notFound();
  }
  
  const page = await getPageBySlug(pageSlug, locale);
  
  if (!page) {
    notFound();
  }
  // const seo = page.fields.seo
  const { contentModules } = page.fields;

  return (
    <div className="min-h-[70vh]">
      <ModuleRenderer
        modules={contentModules}
        registry={contentfulModuleRegistry}
      />
    </div>
  );
}
