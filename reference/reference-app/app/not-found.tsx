import { getPageBySlug } from "@/lib/contentful/fetchers/pageCms";
import { ModuleRenderer } from "@/ui/components/ModuleRenderer";
import { contentfulModuleRegistry } from "@/lib/contentful/registry";

const notFoundPage = await getPageBySlug("404");

export default function NotFound() {
  const contentModules = notFoundPage?.fields?.contentModules;
  if (!notFoundPage || !contentModules) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-lg">
          Sorry, the page you are looking for does not exist.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh]">
      <ModuleRenderer
        modules={contentModules}
        registry={contentfulModuleRegistry}
      />
    </div>
  );
}
