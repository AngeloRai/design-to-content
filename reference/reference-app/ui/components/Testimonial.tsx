import React from 'react'
import type { TestimonialProps } from '@/lib/contentful/types/fields'
import { getBrandBgClass, getContrastTextClass, getContrastSubtextClass, isDarkBackground } from '@/lib/utils/brandColors'

interface ComponentTestimonialProps extends TestimonialProps {
  id?: string;
}

export default function Testimonial({
  name,
  role,
  testimonial,
  showRating,
  backgroundColor = 'surface-pure'
}: ComponentTestimonialProps) {


  const renderStars = (rating: number) => {
    return (
      <div className="flex space-x-1" aria-label={`Rating: ${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${
              star <= rating 
                ? isDarkBackground(backgroundColor) ? 'text-yellow-400' : 'text-yellow-500'
                : isDarkBackground(backgroundColor) ? 'text-white/20' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    )
  }

  return (
    <div
      className={`group p-6 sm:p-8 rounded-2xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${getBrandBgClass(backgroundColor, 'bg-surface-pure')} ${
        isDarkBackground(backgroundColor) 
          ? 'border-white/10 shadow-lg' 
          : 'border-brand-primary/10 shadow-md hover:border-brand-primary/20'
      }`}
    >
      {/* Rating */}
      {showRating && (
        <div className="mb-4">
          {renderStars(5)}
        </div>
      )}

      {/* Testimonial Content */}
      <div className="space-y-6">
        <blockquote>
          <p className={`font-accent text-lg leading-relaxed italic ${getContrastTextClass(backgroundColor)}`}>
            <q>{testimonial}</q>
          </p>
        </blockquote>

        {/* Author Info */}
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <div 
            className={"w-12 h-12 rounded-full flex items-center justify-center bg-brand-primary"}
          >
              <span 
                className="text-lg text-white font-body-bold"
              >
                {name.split(' ').map(n => n[0]).join('')}
              </span>
          </div>

          {/* Name and Role */}
          <div>
            <h4 className={`tracking-tight font-body-bold ${getContrastTextClass(backgroundColor)}`}>
              {name}  
            </h4>
            {(role) && (
              <p 
                className={`text-sm ${getContrastSubtextClass(backgroundColor)}`}
              >
                {role}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}