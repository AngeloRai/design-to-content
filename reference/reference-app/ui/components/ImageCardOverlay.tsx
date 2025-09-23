"use client";

import { useState, useEffect } from "react";

interface ImageCardOverlayProps {
  description?: string;
}

const ChevronIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path d="M18 15L12 9L6 15" />
  </svg>
);

export default function ImageCardOverlay({ description }: ImageCardOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Check if device has touch capability
    const checkTouchDevice = () => {
      const hasTouch = (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-expect-error - msMaxTouchPoints for older browsers
        navigator.msMaxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches
      );
      setIsTouchDevice(hasTouch);
    };

    checkTouchDevice();
    
    // Also check on resize/orientation change in case device capabilities change
    window.addEventListener('resize', checkTouchDevice);
    return () => window.removeEventListener('resize', checkTouchDevice);
  }, []);

  if (!description) return null;

  return (
    <>
      {/* Desktop non-touch: Hover overlay */}
      {!isTouchDevice && (
        <div className="absolute inset-0 items-center justify-center p-6 opacity-0 translate-y-4 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-y-0 hidden sm:flex">
          <p className="text-white text-center text-sm leading-relaxed font-body">
            {description}
          </p>
        </div>
      )}

      {/* Touch devices and small screens: Toggle button and expandable overlay */}
      {(isTouchDevice || typeof window === 'undefined') && (
        <>
          {/* Toggle button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="absolute bottom-2 right-2 z-10 bg-white/90 backdrop-blur-sm 
                       rounded-full p-2 shadow-lg transition-transform duration-200
                       hover:scale-110 active:scale-95"
            aria-label={isExpanded ? "Hide description" : "Show description"}
          >
            <ChevronIcon
              className={`w-5 h-5 text-brand-primary transition-transform duration-200 
                         ${isExpanded ? "rotate-180" : ""}`}
            />
          </button>

          {/* Touch device overlay with background */}
          <div
            className={`absolute inset-0 bg-brand-primary/80 transition-all duration-300
                        ${
                          isExpanded
                            ? "opacity-100"
                            : "opacity-0 pointer-events-none"
                        }`}
          />
          
          {/* Touch device text overlay */}
          <div
            className={`absolute inset-0 flex items-center justify-center p-6 
                        transition-all duration-300 ease-out
                        ${
                          isExpanded
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-4 pointer-events-none"
                        }`}
          >
            <p className="text-white text-center text-sm leading-relaxed font-body">
              {description}
            </p>
          </div>
        </>
      )}
    </>
  );
}