'use client';

import React, { forwardRef, useId } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * TextInput variants using CVA for Tailwind v4 compatibility
 * CVA ensures all variant classes are statically discoverable
 * This is the SINGLE SOURCE OF TRUTH for variant types
 */
const inputVariants = cva(
  'w-full rounded-lg border bg-white transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1',
  {
    variants: {
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-4 text-base',
      },
      state: {
        default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-200',
        error: 'border-red-500 focus:border-red-500 focus:ring-red-200',
      },
    },
    defaultVariants: {
      size: 'md',
      state: 'default',
    },
  }
);

/**
 * TextInput props extend HTML input attributes AND extract variant types from CVA
 *
 * CRITICAL: Omit 'size' from native input props because we define custom size prop
 * This prevents TypeScript errors from prop conflicts between HTML's size and our variant
 *
 * VariantProps<typeof inputVariants> automatically provides:
 * - size?: 'sm' | 'md' | 'lg'
 * - state?: 'default' | 'error'
 * This ensures type safety and IntelliSense support
 */
interface TextInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  helperText?: string;
  onValueChange?: (value: string) => void;
}

/**
 * TextInput component with accessibility features
 *
 * Key features:
 * - useId() for unique, stable IDs (accessibility)
 * - forwardRef for parent component ref access
 * - Proper ARIA attributes (aria-invalid, aria-describedby)
 * - Label properly associated via htmlFor
 * - Error/helper text linked to input
 */
const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  {
    id,
    label,
    size = 'md',
    error,
    helperText,
    className,
    onChange,
    onValueChange,
    required,
    ...rest
  },
  ref
) {
  // Auto-generate unique ID for accessibility
  const autoId = useId();
  const inputId = id ?? `textinput-${autoId}`;
  const hasError = Boolean(error);
  const describedBy = helperText || hasError ? `${inputId}-desc` : undefined;

  const inputState = hasError ? 'error' : 'default';

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-600"> *</span>}
        </label>
      )}

      <input
        id={inputId}
        ref={ref}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy}
        required={required}
        className={cn(inputVariants({ size, state: inputState }), className)}
        onChange={(e) => {
          onChange?.(e);
          onValueChange?.(e.target.value);
        }}
        {...rest}
      />

      {(helperText || hasError) && (
        <p
          id={describedBy}
          className={cn('mt-1 text-xs', hasError ? 'text-red-600' : 'text-gray-500')}
          role={hasError ? 'alert' : undefined}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
});

TextInput.displayName = 'TextInput';

export default TextInput;
