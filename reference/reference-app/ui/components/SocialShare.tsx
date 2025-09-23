"use client";

import Link from "next/link";
import Instagram from "../icons/Instagram";
import Facebook from "../icons/Facebook";
import YouTube from "../icons/YouTube";
import Twitter from "../icons/Twitter";
import type { TypeCta, TypeCtaSkeleton, TypeLinkSkeleton } from "@/lib/contentful/types/generated";
import { isTypeCta } from "@/lib/contentful/types/generated";
import { SupportedLocales } from "@/lib/contentful/types/fields";
import type { Entry } from "contentful";

type SocialLinkEntry = Entry<TypeCtaSkeleton | TypeLinkSkeleton, "WITHOUT_UNRESOLVABLE_LINKS", SupportedLocales>;

interface SocialShareProps {
  links?: (SocialLinkEntry | undefined)[] | null;
  variant?: 'light' | 'dark';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const socialIcons = {
  instagram: Instagram,
  facebook: Facebook,
  youtube: YouTube,
  twitter: Twitter,
};

const platformColors = {
  instagram: '#E4405F',
  facebook: '#1877F2', 
  youtube: '#FF0000',
  twitter: '#1DA1F2',
};

export default function SocialShare({ 
  links, 
  variant = 'light', 
  size = 'medium',
  className = '' 
}: SocialShareProps) {
  const sizeClasses = {
    small: 'w-9 h-9',
    medium: 'w-11 h-11', 
    large: 'w-14 h-14'
  };

  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-7 h-7'
  };

  if (!links || links.length === 0) return null;

  const socialLinks = links
    ?.filter((link): link is TypeCta<"WITHOUT_UNRESOLVABLE_LINKS", SupportedLocales> => {
      if (!link?.fields) return false;
      
      if (!isTypeCta(link)) return false;
      
      return !!link.fields.icon && !!link.fields.url && typeof link.fields.icon === 'string' && Object.keys(socialIcons).includes(link.fields.icon);
    })
    .map(link => {
      const iconValue = link.fields.icon!;
      const urlValue = link.fields.url!;
      const labelValue = link.fields.label;
      
      return {
        platform: iconValue as keyof typeof socialIcons,
        url: urlValue,
        label: labelValue || `Visit our ${iconValue}`
      };
    });
  
  if (socialLinks.length === 0) {
    return null;
  }

  return (
    <div className={`flex gap-3 ${className}`}>
      {socialLinks.map((link, index) => {
        const IconComponent = socialIcons[link.platform];
        const brandColor = platformColors[link.platform];
        
        if (!IconComponent) return null;

        return (
          <Link
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`
              ${sizeClasses[size]} 
              inline-flex items-center justify-center 
              rounded-full transition-all duration-300 
              hover:scale-110 active:scale-95
              focus:outline-none focus:ring-2 focus:ring-offset-2
              ${variant === 'light' 
                ? 'bg-white text-gray-700 hover:text-white border border-gray-200 shadow-sm hover:shadow-lg hover:border-transparent focus:ring-gray-300' 
                : 'bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/30 focus:ring-white/50'
              }
            `}
            style={{
              '--hover-bg': brandColor,
            } as React.CSSProperties}
            onMouseEnter={(e) => {
              if (variant === 'light') {
                e.currentTarget.style.backgroundColor = brandColor;
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.borderColor = brandColor;
              }
            }}
            onMouseLeave={(e) => {
              if (variant === 'light') {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = 'rgb(55 65 81)';
                e.currentTarget.style.borderColor = 'rgb(229 231 235)';
              }
            }}
            aria-label={link.label || `Visit our ${link.platform}`}
          >
            <IconComponent className={`${iconSizes[size]} flex-shrink-0`} />
          </Link>
        );
      })}
    </div>
  );
}