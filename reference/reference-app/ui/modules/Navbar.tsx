import Image from "next/image";
import Link from "next/link";
import CTA from "../components/CTA";
import { getCTAVariantAndClasses, getContrastTextClass, isDarkBackground } from "@/lib/utils/brandColors";
import LogoLight from "../icons/LogoLight";
import SVGRender from "../components/SVGRender";
import { NavbarProps } from "@/lib/contentful/types/fields";
import MobileMenu from "./MobileMenu";
import { getPreloadedLayoutForLocale } from "@/lib/preload/layout-data";
import { getLocale } from "@/lib/locale";
import type { TypeLinkSkeleton } from "@/lib/contentful/types/generated";
import type { DefaultChainModifiers, SupportedLocales } from "@/lib/contentful/types/fields";
import type { Entry } from "contentful";


export default async function Navbar(props: NavbarProps) {
  // Get current locale and fetch appropriate preloaded data
  const locale = await getLocale();
  const localizedLayout = getPreloadedLayoutForLocale(locale);
  const navbarDefaults = localizedLayout?.navbar?.fields || {};
  
  
  // Use provided props or fall back to locale-specific preloaded data
  const {
    logo = navbarDefaults?.logo,
    navigationLinks = navbarDefaults?.navigationLinks || [],
    cta = navbarDefaults?.cta,
    backgroundColor = navbarDefaults?.backgroundColor
  } = props;
  // Pre-process data server-side
  const menuItems = navigationLinks
    ?.filter((link: Entry<TypeLinkSkeleton, DefaultChainModifiers, SupportedLocales> | undefined): link is NonNullable<typeof link> => Boolean(link?.fields))
    ?.map((link: Entry<TypeLinkSkeleton, DefaultChainModifiers, SupportedLocales>) => ({
      label: link.fields?.label || "",
      href: link.fields?.url || "#",
    })) || [];

  // Process logo
  const logoUrl = logo?.fields?.file?.url ? `https:${logo.fields.file.url}` : null;
  const logoTitle = logo?.fields?.title || "Logo";
  const logoFileName = logo?.fields?.file?.fileName || "";
  const isLogoSvg = logoFileName.toLowerCase().endsWith(".svg");

  const LogoComponent = () => {
    if (!logoUrl) {
      return <LogoLight className="h-14 w-auto" />;
    }

    if (isLogoSvg && logoUrl) {
      return (
        <SVGRender 
          src={logoUrl}
          className="h-14 w-auto [&>svg]:h-14 [&>svg]:w-auto [&>svg]:max-h-14"
          ariaLabel={logoTitle}
          componentNamespace="navbar"
        />
      );
    }

    return (
      <Image
        src={logoUrl}
        alt={logoTitle}
        width={56}
        height={56}
        className="h-14 w-auto"
        priority
        style={{ height: "56px", width: "auto" }}
      />
    );
  };

  // Get background color class and text colors
  const isDark = isDarkBackground(backgroundColor);
  const textColorClass = getContrastTextClass(backgroundColor, "text-brand-primary");
  const hoverTextClass = isDark ? "hover:text-white/80" : "hover:text-brand-secondary";
  const borderColor = isDark ? "border-white/20" : "border-brand-primary/15";
  
  // Add opacity to the background color
  const navbarBgClass = backgroundColor === "surface-soft" ? "bg-surface-soft/90" :
                        backgroundColor === "surface-pure" ? "bg-surface-pure/90" :
                        backgroundColor === "brand-primary" ? "bg-brand-primary/90" :
                        backgroundColor === "brand-secondary" ? "bg-brand-secondary/90" :
                        backgroundColor === "brand-accent" ? "bg-brand-accent/90" :
                        backgroundColor === "neutral-dark" ? "bg-neutral-dark/90" :
                        "bg-surface-soft/90";

  return (
    <nav
      id="navbar"
      className={`w-full sticky top-0 z-50 px-6 sm:px-8 lg:px-12 py-5 backdrop-blur-xl shadow-sm border-b-2 transition-all duration-300 ${navbarBgClass} ${borderColor}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo - Fixed width container to prevent layout shift */}
        <div className="flex items-center justify-start w-auto h-14">
          <Link
            href="/"
            className="block transform transition-transform duration-200 hover:scale-105"
          >
            <LogoComponent />
          </Link>
        </div>

        {/* Navigation Menu - Fixed layout with predetermined space */}
        <div className="hidden md:flex items-center justify-center flex-1 h-14">
          <div className="flex items-center space-x-8">
            {menuItems.map((item: { label: string; href: string }, index: number) => (
              <Link
                key={`nav-${index}`}
                href={item.href}
                className={`relative py-3 px-4 whitespace-nowrap
                         transition-all duration-200 ease-out
                         ${textColorClass} ${hoverTextClass}
                         group text-lg font-body-bold`}
              >
                <span className="relative z-10 block">{item.label}</span>
                {/* Elegant underline */}
                <span
                  className={`absolute left-0 right-0 bottom-0 h-[2px]
                           ${isDark ? 'bg-white/60' : 'bg-brand-secondary'}
                           origin-center
                           transition-transform duration-200 ease-out
                           group-hover:scale-x-100 scale-x-0`}
                ></span>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA Button - Enhanced positioning */}
        <div className="hidden sm:flex items-center justify-end">
          {cta && (
            <div className="transform transition-transform duration-200 hover:scale-105">
              <CTA
                {...cta.fields}
                variant={
                  getCTAVariantAndClasses(cta, backgroundColor, "primary")
                    .variant
                }
              />
            </div>
          )}
        </div>

        {/* Mobile Menu - Client-side component */}
        <MobileMenu 
          menuItems={menuItems}
          cta={cta}
          backgroundColor={backgroundColor}
        />
      </div>
    </nav>
  );
}