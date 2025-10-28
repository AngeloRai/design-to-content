import React from 'react';
import { cn } from '@/lib/utils';

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
  const baseClasses = 'font-bold text-black m-0';

  const sizeClasses = {
    1: 'text-4xl',
    2: 'text-3xl',
    3: 'text-2xl',
    4: 'text-xl',
    5: 'text-lg',
    6: 'text-base',
  };

  const combinedClassName = cn(baseClasses, sizeClasses[level], className);

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
