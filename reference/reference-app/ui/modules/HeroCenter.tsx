import Image from "next/image";
import CTA from "../components/CTA";
import { RichText } from "../components/RichText";
import SocialShare from "../components/SocialShare";
import type { HeroProps } from "@/lib/contentful/types/fields";
import type { Document } from "@contentful/rich-text-types";
import { getCTAVariantAndClasses, isDarkBackground } from "@/lib/utils/brandColors";

interface HeroCenterProps extends HeroProps {
  heightClasses: Record<string, string>;
  imageUrl: string | undefined;
  imageAlt: string;
  backgroundColorClass: string;
  headingTextClass: string;
  subheadingTextClass: string;
  copyTextClass: string;
}

export default function HeroCenter({
  heading,
  subheading,
  backgroundColor,
  primaryCta,
  secondaryCta,
  height,
  copy,
  socialShare,
  heightClasses,
  imageUrl,
  imageAlt,
  backgroundColorClass,
  headingTextClass,
  subheadingTextClass,
  copyTextClass
}: HeroCenterProps) {
  return (
    <section
      id="hero"
      className={`relative w-full ${heightClasses[height as keyof typeof heightClasses] || "min-h-[700px]"} overflow-hidden ${backgroundColorClass}`}
    >
      <div className="relative z-10 max-w-7xl mx-auto w-full h-full flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-24">
        <div className="w-full flex flex-col items-center text-center space-y-4 sm:space-y-6 lg:space-y-10">
          <div className="space-y-3 sm:space-y-4 lg:space-y-6 max-w-5xl">
            {heading && (
              <h1 className={`font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl tracking-tight leading-[1.05] ${headingTextClass} font-bold`}>
                {heading}
              </h1>
            )}

            {subheading && (
              <div className={`text-base sm:text-xl lg:text-2xl max-w-4xl mx-auto leading-relaxed ${subheadingTextClass}`}>
                {typeof subheading === "string" ? (
                  <p>{subheading}</p>
                ) : (
                  <RichText
                    content={subheading as Document}
                    className={`[&_p]:${subheadingTextClass}`}
                  />
                )}
              </div>
            )}
          </div>

          {imageUrl && (
            <div className="relative w-full max-w-4xl mt-2 sm:mt-3 lg:mt-4">
              <div className="relative aspect-[16/10] sm:aspect-[16/10] overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-xl lg:shadow-2xl">
                <Image
                  src={imageUrl}
                  alt={imageAlt}
                  fill
                  className="object-cover object-center hover:scale-105 transition-transform duration-700 ease-out"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                  priority
                />
              </div>
            </div>
          )}

          {(primaryCta || secondaryCta) && (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              {primaryCta && (
                <CTA 
                  {...primaryCta.fields} 
                  variant={getCTAVariantAndClasses(primaryCta, backgroundColor, "primary").variant}
                />
              )}
              {secondaryCta && (
                <CTA 
                  {...secondaryCta.fields}
                  variant={getCTAVariantAndClasses(secondaryCta, backgroundColor, "outline").variant}
                />
              )}
            </div>
          )}

          {copy && (
            <div className={`mt-4`}>
              <RichText content={copy} className={copyTextClass} />
            </div>
          )}

          {socialShare && (
            <div className="mt-4">
              <SocialShare 
                links={socialShare.fields?.links}
                variant={isDarkBackground(backgroundColor) ? 'dark' : 'light'}
                size="medium"
                className="justify-center"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}