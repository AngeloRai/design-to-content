'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Keyboard, A11y, Autoplay } from 'swiper/modules'
import type { SwiperRef } from 'swiper/react'
import { ImageCarouselProps } from '@/lib/contentful/types/fields'
import CTA from '../components/CTA'
import { getCTAVariantAndClasses, getBrandBgClass, getContrastTextClass, getContrastSubtextClass } from '@/lib/utils/brandColors'
import ChevronLeft from '../icons/ChevronLeft'
import ChevronRight from '../icons/ChevronRight'
import Play from '../icons/Play'
import Pause from '../icons/Pause'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

interface ComponentImageCarouselProps extends ImageCarouselProps {
  id?: string;
}

export default function ImageCarousel({
  id = "image-carousel",
  heading,
  subheading,
  images = [],
  autoplay = false,
  autoplayInterval = 3000,
  cta,
  backgroundColor,
}: ComponentImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const swiperRef = useRef<SwiperRef>(null);

  // Process Contentful images into displayable format
  const processedImages = images.map((image, index) => {
    if (!image) return null;
    return {
      id: image.sys?.id || index.toString(),
      src: image.fields?.file?.url ? `https:${image.fields.file.url}` : '',
      alt: image.fields?.title || image.fields?.description || `Image ${index + 1}`,
      title: image.fields?.title || `Image ${index + 1}`,
      description: image.fields?.description,
    };
  }).filter((img): img is NonNullable<typeof img> => img !== null && img.src !== ''); // Filter out null images and images without URLs

  const goToSlide = (index: number) => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.slideTo(index);
    }
  };

  const toggleAutoplay = () => {
    if (swiperRef.current && swiperRef.current.swiper && swiperRef.current.swiper.autoplay) {
      if (isPlaying) {
        swiperRef.current.swiper.autoplay.stop();
      } else {
        swiperRef.current.swiper.autoplay.start();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Determine which modules to include
  const swiperModules = [Navigation, Keyboard, A11y];
  if (autoplay) {
    swiperModules.push(Autoplay);
  }

  if (processedImages.length === 0) {
    return null; // Don't render if no valid images
  }

  // Determine background styling based on backgroundColor prop
  const getBackgroundStyle = () => {
    if (!backgroundColor) {
      // Default gradient
      return "bg-gradient-to-br from-neutral-dark to-brand-primary";
    }
    // Use the brand color system for consistent styling
    return getBrandBgClass(backgroundColor, "");
  };

  const getTextColorClass = () => {
    return getContrastTextClass(backgroundColor, "text-white");
  };

  return (
    <section 
      id={id} 
      className={`w-full py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 ${getBackgroundStyle()}`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Heading */}
        {(heading || subheading) && (
          <div className="text-center mb-12">
            {heading && (
              <h2 className={`font-heading text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4 font-body-bold ${getTextColorClass()}`}>
                {heading}
              </h2>
            )}
            {subheading && (
              <p className={`text-lg sm:text-xl max-w-2xl mx-auto ${getContrastSubtextClass(backgroundColor, "text-white/70")}`}>
                {subheading}
              </p>
            )}
          </div>
        )}

        {/* Swiper Carousel */}
        <div className="space-y-8">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-t from-black/40 to-transparent">
            <Swiper
              ref={swiperRef}
              modules={swiperModules}
              spaceBetween={0}
              slidesPerView={1}
              navigation={{
                prevEl: '.swiper-button-prev-custom',
                nextEl: '.swiper-button-next-custom',
              }}
              autoplay={
                autoplay && isPlaying
                  ? {
                      delay: autoplayInterval || 3000,
                      disableOnInteraction: false,
                      pauseOnMouseEnter: true,
                    }
                  : false
              }
              keyboard={{
                enabled: true,
              }}
              a11y={{
                prevSlideMessage: 'Previous slide',
                nextSlideMessage: 'Next slide',
              }}
              onSlideChange={(swiper) => setCurrentIndex(swiper.activeIndex)}
              className="w-full h-auto"
            >
              {processedImages.map((image, index) => (
                <SwiperSlide key={image.id} className="h-auto">
                  <div className="flex flex-col w-full">
                    <div className="aspect-[16/9] relative overflow-hidden flex-shrink-0">
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={index === 0}
                      />
                    </div>
                    
                    {/* Content Below Image */}
                    <div className="px-4 pt-3 pb-4 sm:px-6 sm:pt-4 sm:pb-6 lg:px-8 lg:pt-5 lg:pb-8 text-white">
                      <h3 className="text-xl sm:text-2xl lg:text-3xl mb-2 font-body-bold leading-tight">
                        {image.title}
                      </h3>
                      {image.description && (
                        <p className="text-base sm:text-lg opacity-90 max-w-md leading-relaxed">
                          {image.description}
                        </p>
                      )}
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Navigation Buttons Inside Image */}
            <button
              className="swiper-button-prev-custom absolute top-1/2 left-4 z-10 -translate-y-1/2 cursor-pointer w-12 h-12 bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 rounded-full transition-colors duration-200"
              aria-label="Previous image"
            >
              <ChevronLeft />
            </button>
            
            <button
              className="swiper-button-next-custom absolute top-1/2 right-4 z-10 -translate-y-1/2 cursor-pointer w-12 h-12 bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 rounded-full transition-colors duration-200"
              aria-label="Next image"
            >
              <ChevronRight />
            </button>

            {/* Play/Pause Button - only show if autoplay is enabled */}
            {autoplay && (
              <button
                onClick={toggleAutoplay}
                className="absolute top-4 right-4 z-10 cursor-pointer w-10 h-10 bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 rounded-full transition-colors duration-200"
                aria-label={isPlaying ? "Pause autoplay" : "Resume autoplay"}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Thumbnail Navigation */}
          <div className="flex justify-center mt-4 space-x-2 flex-wrap gap-2">
            {processedImages.map((image, index) => (
              <button
                key={image.id}
                onClick={() => goToSlide(index)}
                className={`w-16 h-10 cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 relative ${
                  currentIndex === index 
                    ? 'border-white scale-110' 
                    : 'border-white/30 hover:border-white/60'
                }`}
                aria-label={`Go to ${image.title}`}
              >
                <div className="relative w-full h-full">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              </button>
            ))}
          </div>

          {/* CTA Button */}
          {cta && (
            <div className="flex justify-center mt-8">
              <CTA 
                {...cta.fields}
                variant={getCTAVariantAndClasses(cta, backgroundColor, "primary").variant}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}