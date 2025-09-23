import React from 'react'
import CTA from './CTA'
import IconRenderer from '../icons/IconRenderer'
import type { CardProps } from '@/lib/contentful/types/fields'
import { getBrandBgClass, getContrastTextClass, getContrastIconClass, getContrastSubtextClass, getCTAVariantAndClasses, isDarkBackground } from '@/lib/utils/brandColors'

interface ComponentCardProps extends CardProps {
  id?: string;
}

export default function Card({
  backgroundColor = 'surface-pure',
  icon,
  heading,
  subheading,
  cta
}: ComponentCardProps) {
  const bgClass = getBrandBgClass(backgroundColor, 'bg-surface-pure')


  return (
    <div
      className={`group p-6 sm:p-8 rounded-2xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl flex flex-col h-full ${bgClass} ${
        isDarkBackground(backgroundColor) 
          ? 'border-white/10 shadow-lg' 
          : 'border-brand-primary/10 shadow-md hover:border-brand-primary/20'
      }`}
    >
      {/* Icon */}
      <div className={`mb-6 ${getContrastIconClass(backgroundColor)}`}>
        <IconRenderer name={icon} />
      </div>

      {/* Content */}
      <div className="flex flex-col h-full">
        <div className="space-y-4 flex-grow">
          <h3 className={`text-xl sm:text-2xl tracking-tight font-body-bold ${getContrastTextClass(backgroundColor)}`}>
            {heading}
          </h3>
          
          <p className={`leading-relaxed font-body ${getContrastSubtextClass(backgroundColor)}`}>
            {subheading}
          </p>
        </div>

          {cta && (
            <div className="pt-6 mt-auto">
              <CTA 
                {...cta.fields}
                variant={getCTAVariantAndClasses(cta, backgroundColor, "primary").variant}
              />
            </div>
          )}
      </div>
    </div>
  );
}