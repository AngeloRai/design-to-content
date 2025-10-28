import React from 'react';
import { cn } from '@/lib/utils';

interface BodyTextProps {
  size?: 'large' | 'medium' | 'small' | 'caption';
  children: React.ReactNode;
  className?: string;
}

/**
 * BodyText component for paragraph/body text
 * Simple component with size variants
 */
const BodyText = ({ size = 'medium', children, className }: BodyTextProps) => {
  const baseClasses = 'font-inter text-black m-0';

  const sizeClasses = {
    large: 'text-lg',
    medium: 'text-base',
    small: 'text-sm',
    caption: 'text-xs',
  };

  return <p className={cn(baseClasses, sizeClasses[size], className)}>{children}</p>;
};

export default BodyText;
