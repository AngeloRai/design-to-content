import Image from "next/image";
import CTA from "./CTA";
import ImageCardOverlay from "./ImageCardOverlay";
import { toAbsoluteCtfUrl } from "@/lib/contentful/utils/image";
import { ImageCardProps } from "@/lib/contentful/types/fields";
import {
  getBrandBgClass,
  getContrastTextClass,
  getCTAVariantAndClasses,
} from "@/lib/utils/brandColors";

type ComponentImageCardProps = ImageCardProps & {
  className?: string;
};

export default function ImageCard({
  image,
  heading,
  cta,
  backgroundColor = "surface-pure",
  description,
  className = "",
}: ComponentImageCardProps) {
  const hasContentfulImage = image?.fields?.file?.url;
  const imageUrl = toAbsoluteCtfUrl(image?.fields?.file?.url);
  const imageAlt = image?.fields?.title || heading;

  const ctaVariantAndClasses = getCTAVariantAndClasses(
    cta,
    backgroundColor,
    "outline"
  );

  return (
    <div
      className={`group relative overflow-hidden rounded-xl shadow-sm 
                  transition-all duration-300 hover:shadow-xl hover:-translate-y-1 
                  ${getBrandBgClass(backgroundColor, "bg-surface-pure")} ${className}`}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-soft/20">
        {hasContentfulImage && imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {/* <img
              src="/logo-140.svg"
              alt={heading}
              className="w-32 h-32 transition-transform duration-500 group-hover:scale-105 opacity-60"
            /> */}
            <Image
              src="/logo-110.svg"
              alt={heading}
              width={120} // Optional: specify width
              height={120} // Optional: specify height
              unoptimized // Optional: if you don't need Next.js image optimization for this SVG
            />
          </div>
        )}

        {/* Overlay that appears on hover */}
        <div className="absolute inset-0 bg-brand-primary/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Interactive overlay component for all devices */}
        <ImageCardOverlay description={description} />
      </div>

      {/* Content */}
      <div
        className={`p-6 space-y-4 ${getBrandBgClass(backgroundColor, "bg-surface-pure")}`}
      >
        <h3
          className={`font-body-bold text-xl leading-tight ${getContrastTextClass(backgroundColor)}`}
        >
          {heading}
        </h3>

        {cta && (
          <div className="transition-transform duration-200 group-hover:scale-105">
            <CTA
              {...cta.fields}
              variant={ctaVariantAndClasses.variant}
              className={ctaVariantAndClasses.className}
            />
          </div>
        )}
      </div>
    </div>
  );
}
