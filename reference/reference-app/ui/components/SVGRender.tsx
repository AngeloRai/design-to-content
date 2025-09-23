interface SVGRenderProps {
  src: string;
  className?: string;
  ariaLabel?: string;
  componentNamespace?: string;
}

async function fetchSVGContent(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (response.ok) {
      return await response.text();
    }
  } catch (error) {
    console.warn('Failed to fetch SVG:', error);
  }
  return null;
}

export default async function SVGRender({ 
  src, 
  className = "", 
  ariaLabel = "SVG",
  componentNamespace = "svg"
}: SVGRenderProps) {
  const svgContent = await fetchSVGContent(src);
  
  if (!svgContent) {
    return null;
  }

  // Make CSS class names unique by prefixing with component namespace
  let processedContent = svgContent;
  processedContent = processedContent.replace(/class="([^"]+)"/g, `class="${componentNamespace}-$1"`);
  processedContent = processedContent.replace(/\.([a-zA-Z][\w-]*)/g, `.${componentNamespace}-$1`);

  return (
    <span 
      className={className}
      dangerouslySetInnerHTML={{ __html: processedContent }}
      role="img"
      aria-label={ariaLabel}
    />
  );
}