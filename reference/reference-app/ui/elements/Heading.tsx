import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Heading variants using CVA for Tailwind v4 compatibility
 */
const headingVariants = cva('font-bold text-black m-0', {
  variants: {
    level: {
      1: 'text-4xl',
      2: 'text-3xl',
      3: 'text-2xl',
      4: 'text-xl',
      5: 'text-lg',
      6: 'text-base',
    },
  },
});

interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
}

/**
 * Heading component - renders h1-h6 based on level prop
 * Uses switch statement for TypeScript-safe dynamic element rendering
 */
const Heading = ({ level, children, className }: HeadingProps) => {
  const combinedClassName = cn(headingVariants({ level }), className);

  // Switch statement is the ONLY TypeScript-safe way to render dynamic elements
  // DO NOT use: `h${level}` as keyof JSX.IntrinsicElements - causes compilation errors
  switch (level) {
    case 1:
      return <h1 className={combinedClassName}>{children}</h1>;
    case 2:
      return <h2 className={combinedClassName}>{children}</h2>;
    case 3:
      return <h3 className={combinedClassName}>{children}</h3>;
    case 4:
      return <h4 className={combinedClassName}>{children}</h4>;
    case 5:
      return <h5 className={combinedClassName}>{children}</h5>;
    case 6:
      return <h6 className={combinedClassName}>{children}</h6>;
  }
};

export default Heading;
