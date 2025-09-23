import Image from "next/image";
import CTA from "../components/CTA";
import { ImageTextProps } from "@/lib/contentful/types/fields";
import { RichText } from "../components/RichText";
import { getBrandBgClass, getCTAVariantAndClasses, getContrastTextClass, isDarkBackground } from "@/lib/utils/brandColors";

type ComponentImageTextProps = ImageTextProps & {
  id?: string;
};

export default function ImageText({
  id = "imagetext",
  heading = "Untitled Section", 
  subheading,
  image,
  imagePosition,
  backgroundColor,
  primaryCta,
  secondaryCta,
}: ComponentImageTextProps) {
  const bgClass = getBrandBgClass(backgroundColor, "bg-surface-pure");


  if (imagePosition === "overlay") {
    return (
      <section
        id={id}
        className={`w-full relative overflow-hidden ${bgClass}`}
      >
        {/* Background Image for overlay */}
        {image?.fields?.file?.url && (
          <div className="absolute inset-0">
            <Image
              src={image?.fields?.file?.url}
              alt={
                image?.fields?.description ||
                image?.fields?.title ||
                "Background"
              }
              fill
              className="object-cover object-center"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>
        )}
        
        {/* Content */}
        <div className="relative z-10 py-20 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-2xl">
              <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl tracking-tight font-body-bold leading-[1.1] text-white">
                {heading}
              </h2>
              
              <div className="mt-6 text-base sm:text-lg leading-relaxed">
                {subheading && <RichText content={subheading} className="font-body [&_p]:text-white/90 [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h4]:text-white [&_h5]:text-white [&_h6]:text-white [&_li]:text-white/90 [&_blockquote]:text-white/80" />}
              </div>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                {primaryCta && (
                  <CTA 
                    {...primaryCta.fields}
                    variant={getCTAVariantAndClasses(primaryCta, backgroundColor, "primary").variant}
                    className="!bg-white !text-neutral-dark !border-white hover:!bg-white/90"
                  />
                )}
                {secondaryCta && (
                  <CTA 
                    {...secondaryCta.fields}
                    variant={getCTAVariantAndClasses(secondaryCta, backgroundColor, "outline").variant}
                    className="!bg-brand-primary !text-white !border-brand-primary hover:!bg-brand-primary/90"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id={id}
      className={`w-full py-20 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 ${bgClass}`}
    >
      <div className="max-w-7xl mx-auto">
        <div className={`grid lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-20 items-center`}>
          {/* Text Content */}
          <div
            className={`flex flex-col justify-center ${
              imagePosition === "left" ? "lg:order-2" : "lg:order-1"
            }`}
          >
            <h2
              className={`font-heading text-4xl sm:text-5xl lg:text-6xl tracking-tight font-body-bold leading-[1.1] ${getContrastTextClass(backgroundColor)}`}
            >
              {heading}
            </h2>

            <div className="mt-6 text-base sm:text-lg leading-relaxed">
              {subheading && (
                <RichText
                  content={subheading}
                  className={
                    isDarkBackground(backgroundColor) 
                      ? "font-body [&_p]:text-white/90 [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h4]:text-white [&_h5]:text-white [&_h6]:text-white [&_li]:text-white/90 [&_blockquote]:text-white/80 [&_a]:text-white" 
                      : "font-body [&_p]:text-gray-600 [&_li]:text-gray-600 [&_blockquote]:text-gray-700"
                  } 
                />
              )}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              {primaryCta && (
                <CTA 
                  {...primaryCta.fields}
                  variant={getCTAVariantAndClasses(primaryCta, backgroundColor, "primary").variant}
                  className={
                    isDarkBackground(backgroundColor) 
                      ? "!bg-white !text-neutral-dark !border-white hover:!bg-white/90"
                      : ""
                  }
                />
              )}
              {secondaryCta && (
                <CTA 
                  {...secondaryCta.fields}
                  variant={getCTAVariantAndClasses(secondaryCta, backgroundColor, "outline").variant}
                  className={
                    isDarkBackground(backgroundColor) 
                      ? "!bg-brand-primary !text-white !border-brand-primary hover:!bg-brand-primary/90"
                      : ""
                  }
                />
              )}
            </div>
          </div>

          {/* Image */}
          <div
            className={`relative ${
              imagePosition === "left" ? "lg:order-1" : "lg:order-2"
            }`}
          >
            {image?.fields?.file?.url && (
              <div className="relative aspect-[4/3] lg:aspect-[4/3] overflow-hidden rounded-3xl shadow-2xl">
                <Image
                  src={image?.fields?.file?.url}
                  alt={
                    image?.fields?.description ||
                    image?.fields?.title ||
                    "Image"
                  }
                  fill
                  className={`object-cover object-center hover:scale-105 transition-transform duration-700 ease-out`}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
