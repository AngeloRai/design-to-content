import { RichText } from "../components/RichText";
import type { RichTextBlockProps } from "@/lib/contentful/types/fields";
import { getBrandBgClass } from "@/lib/utils/brandColors";

function RichTextBlock({ copy, backgroundColor }: RichTextBlockProps) {
  if (!copy) return null;

  const bgColorClass = getBrandBgClass(backgroundColor, "bg-surface-soft");

  return (
    <section className={`w-full py-12 lg:py-16 ${bgColorClass}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <RichText content={copy} />
      </div>
    </section>
  );
}

export default RichTextBlock;
