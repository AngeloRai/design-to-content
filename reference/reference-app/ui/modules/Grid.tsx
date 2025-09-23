'use client'

import Card from '../components/Card'
import ImageCard from '../components/ImageCard'
import Testimonial from '../components/Testimonial'
import type { GridProps } from '@/lib/contentful/types/fields'
import { isTypeComponentCard, isTypeComponentImageCard, isTypeComponentTestimonial } from '@/lib/contentful/types/generated'
import type { IconName } from '../icons/IconRenderer'
import { getBrandBgClass, getContrastTextClass, getContrastSubtextClass } from '@/lib/utils/brandColors'

interface ComponentGridProps extends GridProps {
  id?: string;
}


export default function Grid({
  id = 'grid',
  heading,
  subheading,
  items = [],
  backgroundColor = 'surface-pure',
}: ComponentGridProps) {
  const bgClass = getBrandBgClass(backgroundColor, 'bg-surface-pure')


  // Use all items together instead of separating by type
  const validItems = items?.filter(item => item && (
    isTypeComponentCard(item) || 
    isTypeComponentImageCard(item) || 
    isTypeComponentTestimonial(item)
  )) || []
  
  // Check if we have mixed types to determine grid behavior
  const hasTestimonials = validItems.some(item => item && isTypeComponentTestimonial(item))
  const hasImageCards = validItems.some(item => item && isTypeComponentImageCard(item))
  const hasCards = validItems.some(item => item && isTypeComponentCard(item))
  
  // If we have mixed types, use a flexible grid layout
  const isMixedGrid = (hasTestimonials ? 1 : 0) + (hasImageCards ? 1 : 0) + (hasCards ? 1 : 0) > 1
  const isTestimonialGrid = hasTestimonials && !isMixedGrid
  const isImageCardGrid = hasImageCards && !isMixedGrid
  
  // Determine grid layout based on number of items and type
  const getGridCols = (itemCount: number, isTestimonial: boolean = false, isImageCard: boolean = false, isMixed: boolean = false) => {
    // For mixed grids, use flexible layout that works for all card types
    if (isMixed) {
      if (itemCount === 1) return 'grid-cols-1 justify-items-center max-w-lg mx-auto';
      if (itemCount === 2) return 'grid-cols-1 md:grid-cols-2';
      if (itemCount === 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      // Mixed grids: max 4 per row, flexible for all card types
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    }
    
    if (isTestimonial) {
      if (itemCount === 1) return 'grid-cols-1 justify-items-center max-w-2xl mx-auto';
      if (itemCount === 2) return 'grid-cols-1 lg:grid-cols-2';
      // For testimonials, max 3 per row for better readability
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
    
    if (isImageCard) {
      if (itemCount === 1) return 'grid-cols-1 justify-items-center max-w-sm mx-auto';
      if (itemCount === 2) return 'grid-cols-1 md:grid-cols-2';
      if (itemCount === 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      // Image cards: max 4 per row, auto-wraps to next row
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    }
    
    // Regular cards: max 4 per row for all cases
    if (itemCount === 1) return 'grid-cols-1 justify-items-center max-w-md mx-auto';
    if (itemCount === 2) return 'grid-cols-1 md:grid-cols-2';
    if (itemCount === 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    // 4 or more items: max 4 per row, wraps automatically
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  };

  return (
    <section id={`${id}-${heading ? '-heading' : ''}`} className={`w-full py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 ${bgClass}`}>
      <div className="max-w-7xl mx-auto">
        {(heading || subheading) && (
          <div className="text-center mb-12">
            {heading && (
              <h2 className={`font-heading text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4 ${getContrastTextClass(backgroundColor)}`}>
                {heading}
              </h2>
            )}
            {subheading && (
              <p 
                className={`font-body text-lg sm:text-xl max-w-2xl mx-auto ${getContrastSubtextClass(backgroundColor)}`}
              >
                {subheading}
              </p>
            )}
          </div>
        )}

        <div className={`grid gap-6 lg:gap-8 ${getGridCols(validItems.length, isTestimonialGrid, isImageCardGrid, isMixedGrid)}`}>
          {validItems.map((item, index) => {
            if (!item) return null;
            
            if (isTypeComponentCard(item)) {
              const fields = item.fields
              const cardProps = {
                heading: fields.heading || '',
                subheading: fields.subheading || '',
                icon: (fields.icon || 'music') as IconName,
                cta: fields.cta,
                backgroundColor: fields.backgroundColor || 'surface-pure'
              }
              
              return (
                <Card
                  key={item.sys.id}
                  id={item.sys.id}
                  {...cardProps}
                />
              )
            }
            
            if (isTypeComponentImageCard(item)) {
              const fields = item.fields
              const imageCardProps = {
                heading: fields.heading || '',
                description: fields.description || '',
                image: fields.image,
                cta: fields.cta,
                backgroundColor: fields.backgroundColor || 'surface-pure'
              }
              
              return (
                <ImageCard
                  key={`${item.sys.id}-${index}`}
                  {...imageCardProps}
                />
              )
            }
            
            if (isTypeComponentTestimonial(item)) {
              const fields = item.fields
              const testimonialProps = {
                name: fields.name || '',
                role: fields.role,
                testimonial: fields.testimonial || '',
                showRating: fields.showRating,
                backgroundColor: fields.backgroundColor || 'surface-pure'
              }
              
              return (
                <Testimonial
                  key={item.sys.id}
                  id={item.sys.id}
                  {...testimonialProps}
                />
              )
            }
            
            return null
          })}
        </div>
      </div>
    </section>
  );
}