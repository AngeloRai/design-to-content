import Image from "next/image";
import CTA from "../components/CTA";
import { RichText } from "../components/RichText";
import SocialShare from "../components/SocialShare";
import type { HeroProps } from "@/lib/contentful/types/fields";
import type { Document } from "@contentful/rich-text-types";
import { getCTAVariantAndClasses, isDarkBackground } from "@/lib/utils/brandColors";

interface HeroSplitProps extends HeroProps {
  heightClasses: Record<string, string>;
  imageUrl: string | undefined;
  imageAlt: string;
  backgroundColorClass: string;
  headingTextClass: string;
  subheadingTextClass: string;
  copyTextClass: string;
}

export default function HeroSplit({
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
}: HeroSplitProps) {
  const links = socialShare?.fields?.links;

  return (
    <section
      id="hero"
      className={`relative w-full ${heightClasses[height as keyof typeof heightClasses] || "min-h-screen"} overflow-hidden ${backgroundColorClass}`}
    >
      <div className="relative z-10 max-w-7xl mx-auto w-full h-full flex items-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-24">
        <div className="lg:hidden w-full flex flex-col items-center text-center space-y-4 sm:space-y-6">
          {heading && (
            <h1 className={`font-heading text-3xl sm:text-4xl md:text-5xl tracking-tight leading-[1.02] ${headingTextClass}`}>
              {heading}
            </h1>
          )}

          {subheading && (
            <div className={`text-base sm:text-lg max-w-2xl leading-relaxed ${subheadingTextClass}`}>
              {typeof subheading === "string" ? (
                <p>{subheading}</p>
              ) : (
                <RichText
                  content={subheading as Document}
                  className={`[&_p]:${subheadingTextClass} [&_p]:leading-relaxed`}
                />
              )}
            </div>
          )}

          {imageUrl && (
            <div className="w-full max-w-sm mx-auto">
              <div className="relative aspect-square overflow-hidden rounded-xl shadow-xl">
                <Image
                  src={imageUrl}
                  alt={imageAlt}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 400px"
                  priority
                />
              </div>
            </div>
          )}

          {(primaryCta || secondaryCta) && (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
              {primaryCta && (
                <CTA 
                  {...primaryCta.fields} 
                  variant={getCTAVariantAndClasses(primaryCta, backgroundColor, "primary").variant}
                  size={primaryCta.fields?.size || "large"}
                />
              )}
              {secondaryCta && (
                <CTA 
                  {...secondaryCta.fields}
                  variant={getCTAVariantAndClasses(secondaryCta, backgroundColor, "outline").variant}
                  size={secondaryCta.fields?.size || "large"}
                />
              )}
            </div>
          )}

          {copy && (
            <div className={`max-w-xl ${copyTextClass}`}>
              <RichText content={copy} className={`[&_p]:${copyTextClass} [&_p]:text-base [&_p]:leading-relaxed`} />
            </div>
          )}

          {socialShare && (
            <div className="pt-2">
              <SocialShare 
                links={links}
                variant={isDarkBackground(backgroundColor) ? 'dark' : 'light'}
                size="medium"
                className="justify-center"
              />
            </div>
          )}
        </div>

        <div className="hidden lg:grid lg:grid-cols-2 gap-16 items-center w-full min-h-[600px]">
          <div className="space-y-8">
            {heading && (
              <h1 className={`font-heading text-6xl xl:text-7xl tracking-tight leading-[1.02] ${headingTextClass}`}>
                {heading}
              </h1>
            )}

            {subheading && (
              <div className={`text-xl xl:text-2xl max-w-2xl leading-relaxed ${subheadingTextClass}`}>
                {typeof subheading === "string" ? (
                  <p>{subheading}</p>
                ) : (
                  <RichText
                    content={subheading as Document}
                    className={`[&_p]:${subheadingTextClass} [&_p]:leading-relaxed`}
                  />
                )}
              </div>
            )}

            {(primaryCta || secondaryCta) && (
              <div className="flex flex-row gap-4 pt-4">
                {primaryCta && (
                  <CTA 
                    {...primaryCta.fields} 
                    variant={getCTAVariantAndClasses(primaryCta, backgroundColor, "primary").variant}
                    size={primaryCta.fields?.size || "large"}
                  />
                )}
                {secondaryCta && (
                  <CTA 
                    {...secondaryCta.fields}
                    variant={getCTAVariantAndClasses(secondaryCta, backgroundColor, "outline").variant}
                    size={secondaryCta.fields?.size || "large"}
                  />
                )}
              </div>
            )}

            {copy && (
              <div className={`max-w-xl ${copyTextClass}`}>
                <RichText content={copy} className={`[&_p]:${copyTextClass} [&_p]:text-base [&_p]:leading-relaxed`} />
              </div>
            )}

            {socialShare && (
              <div className="pt-4">
                <SocialShare 
                  links={links}
                  variant={isDarkBackground(backgroundColor) ? 'dark' : 'light'}
                  size="medium"
                  className="justify-start"
                />
              </div>
            )}
          </div>

          {imageUrl && (
            <div className="flex justify-center items-center">
              <div className="relative w-full max-w-lg">
                <div className="relative aspect-square overflow-hidden rounded-3xl shadow-2xl">
                  <Image
                    src={imageUrl}
                    alt={imageAlt}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 1200px) 50vw, 500px"
                    priority
                  />
                </div>
                <div className={`absolute -bottom-4 -right-4 w-24 h-24 ${
                  isDarkBackground(backgroundColor) ? 'bg-white/10' : 'bg-black/10'
                } rounded-2xl -z-10`} />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}