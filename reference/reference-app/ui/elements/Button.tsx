import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Button variants using CVA for Tailwind v4 compatibility
 * CVA ensures all variant classes are statically discoverable
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
        outline: 'border-2 border-gray-300 bg-transparent hover:bg-gray-100 focus:ring-gray-500',
        ghost: 'bg-transparent hover:bg-gray-100 focus:ring-gray-500',
        destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
}

/**
 * Button component with variants and sizes
 * Extends native button props for full HTML compatibility
 * Uses forwardRef for parent component ref access
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, className, children, type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
