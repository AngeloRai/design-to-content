import type { HeroProps } from "@/lib/contentful/types/fields";
import { getBrandBgClass, getContrastTextClass, getContrastSubtextClass } from "@/lib/utils/brandColors";
import HeroSplit from "./HeroSplit";
import HeroOverlay from "./HeroOverlay";
import HeroCenter from "./HeroCenter";

function Hero({
  heading,
  subheading,
  image,
  backgroundColor,
  primaryCta,
  secondaryCta,
  height,
  copy,
  imagePosition,
  socialShare
}: HeroProps) {
  const heightClasses = {
    small: "min-h-[500px]",
    medium: "min-h-[600px]",
    large: "min-h-[700px]",
    "full screen": "min-h-screen",
  };

  const imageUrl = image?.fields?.file?.url;
  const imageAlt = image?.fields?.title || heading || "Hero image";

  const classes = {
    background: getBrandBgClass(backgroundColor, "bg-surface-soft"),
    heading: getContrastTextClass(backgroundColor, 'text-neutral-dark'),
    subheading: `font-body ${getContrastSubtextClass(backgroundColor, 'text-gray-600')}`,
    copy: `font-accent italic font-light ${getContrastSubtextClass(backgroundColor, 'text-gray-600')}`
  };

  // Common props for all variations
  const commonProps = {
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
    backgroundColorClass: classes.background,
    headingTextClass: classes.heading,
    subheadingTextClass: classes.subheading,
    copyTextClass: classes.copy
  };

  // Split variation - content left, image right
  if (imagePosition === "split" && imageUrl) {
    return <HeroSplit {...commonProps} />;
  }

  // Overlay variation
  if (imagePosition === "overlay" && imageUrl) {
    return <HeroOverlay {...commonProps} />;
  }

  // Default center variation
  return <HeroCenter {...commonProps} />;
}

export default Hero;