import type { ModuleRegistry, ContentfulModule } from '@/lib/contentful/types/module-renderer'

interface ModuleRendererProps {
  modules?: (ContentfulModule | undefined | null)[]
  registry: ModuleRegistry
}

export function ModuleRenderer({ modules, registry }: ModuleRendererProps) {
  if (!modules?.length || !registry) return null

  return (
    <>
      {modules.map((module, index) => {
        // Skip null/undefined modules
        if (!module?.sys?.contentType?.sys?.id) return null

        const contentTypeId = module.sys.contentType.sys.id
        const Component = registry[contentTypeId]

        if (!Component) {
          console.warn(`ModuleRenderer: No component found for content type "${contentTypeId}"`)
          return null
        }

        // Module fields are already localized from the page fetch
        return (
          <Component
            key={`${contentTypeId}-${module.sys.id}`}
            {...module.fields}
            index={index}
          />
        )
      })}
    </>
  )
}