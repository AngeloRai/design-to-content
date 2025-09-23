import Image from "next/image";
import Link from "next/link";
import LogoLight from "../icons/LogoLight";
import SVGRender from "../components/SVGRender";
import { FooterProps } from "@/lib/contentful/types/fields";
import { getPreloadedLayoutForLocale } from "@/lib/preload/layout-data";
import SocialShare from "../components/SocialShare";
import LocaleSelector from "../components/LocaleSelector";
import { getLocale } from "@/lib/locale";
import type { TypeComponentLinks, TypeLinkSkeleton, TypeCtaSkeleton } from "@/lib/contentful/types/generated";
import type { DefaultChainModifiers, SupportedLocales } from "@/lib/contentful/types/fields";
import type { Entry } from "contentful";

export default async function Footer(props: FooterProps) {
  // Get current locale and fetch appropriate preloaded data
  const currentLocale = await getLocale();
  const localizedLayout = getPreloadedLayoutForLocale(currentLocale);
  const footerDefaults = localizedLayout?.footer?.fields || {};
  
  
  // Use provided props or fall back to locale-specific preloaded data
  const {
    logo = footerDefaults?.logo,
    slogan = footerDefaults?.slogan,
    links = footerDefaults?.links || [],
    copyrightMessage = footerDefaults?.copyrightMessage,
    copyrightLinks = footerDefaults?.copyrightLinks || [],
    socialShare = footerDefaults?.socialShare,
  } = props;
  const logoUrl = logo?.fields?.file?.url
    ? `https:${logo.fields.file.url}`
    : null;
  const logoTitle = logo?.fields?.title || "Logo";
  const logoFileName = logo?.fields?.file?.fileName || "";
  const isLogoSvg = logoFileName.toLowerCase().endsWith(".svg");


  const LogoComponent = () => {
    if (!logoUrl) {
      return <LogoLight className="h-12 w-auto" />;
    }

    if (isLogoSvg && logoUrl) {
      return (
        <SVGRender 
          src={logoUrl}
          className="h-12 w-auto [&>svg]:h-12 [&>svg]:w-auto [&>svg]:max-h-12 [&>svg]:brightness-0 [&>svg]:invert"
          ariaLabel={logoTitle}
          componentNamespace="footer"
        />
      );
    }

    return (
      <Image
        src={logoUrl}
        alt={logoTitle}
        width={112}
        height={48}
        className="h-12 w-auto brightness-0 invert"
      />
    );
  };

  return (
    <footer
      id="footer"
      className="w-full pt-16 pb-8 px-4 sm:px-6 lg:px-8 bg-neutral-dark"
    >
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <LogoComponent />

            {slogan && (
              <div className="pt-6 text-sm leading-relaxed max-w-xs font-body text-white/70">
                {slogan}
              </div>
            )}

            {/* Social Links */}
            {socialShare?.fields?.links && (
              <SocialShare
                links={socialShare.fields.links}
                variant="dark"
                size="medium"
                className="pt-2"
              />
            )}
          </div>

          {/* Footer Links Sections */}
          {links?.map((section: TypeComponentLinks<DefaultChainModifiers, SupportedLocales> | undefined, index: number) => {
            if (!section?.fields) return null;

            return (
              <div key={index} className="space-y-4">
                {section.fields.title && (
                  <h3 className="tracking-wide text-white font-body-bold">
                    {section.fields.title}
                  </h3>
                )}
                <ul className="space-y-2">
                  {section.fields.links?.map((link: Entry<TypeCtaSkeleton | TypeLinkSkeleton, DefaultChainModifiers, SupportedLocales> | undefined, linkIndex: number) => {
                    if (!link?.fields) return null;

                    return (
                      <li key={linkIndex}>
                        <Link
                          href={link.fields.url || "#"}
                          className="text-sm transition-colors duration-200 hover:opacity-70 font-body text-white/70"
                        >
                          {link.fields.label || ""}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Bottom Border */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm font-body text-white/50">
              {copyrightMessage || "© 2025 All rights reserved."}
            </p>

            <div className="flex items-center space-x-6">
              {/* Locale Selector */}
              <LocaleSelector currentLocale={currentLocale} variant="footer" />
              
              {/* Copyright Links */}
              <div className="flex space-x-6">
                {copyrightLinks?.map((link: Entry<TypeLinkSkeleton, DefaultChainModifiers, SupportedLocales> | undefined, index: number) => {
                  if (!link?.fields) return null;

                  return (
                    <Link
                      key={index}
                      href={link.fields.url || "#"}
                      className="text-sm transition-colors duration-200 hover:opacity-70 font-body text-white/50"
                    >
                      {link.fields.label || ""}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
