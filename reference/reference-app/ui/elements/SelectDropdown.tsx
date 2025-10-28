'use client';

import React, { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * CRITICAL: Omit 'size' from native select props to avoid conflicts
 */
interface SelectDropdownProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string }>;
  onValueChange?: (value: string) => void;
}

/**
 * SelectDropdown component with accessibility
 *
 * IMPORTANT: Uses 'onValueChange' prop instead of conflicting with native 'onChange'
 * Native select elements have their own onChange handler that we preserve
 */
const SelectDropdown = forwardRef<HTMLSelectElement, SelectDropdownProps>(function SelectDropdown(
  {
    id,
    label,
    size = 'md',
    error,
    helperText,
    options,
    className,
    onChange,
    onValueChange,
    required,
    ...rest
  },
  ref
) {
  const autoId = useId();
  const selectId = id ?? `select-${autoId}`;
  const hasError = Boolean(error);
  const describedBy = helperText || hasError ? `${selectId}-desc` : undefined;

  const baseClasses =
    'w-full rounded-lg border bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1';

  const sizeClasses = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-4 text-base',
  };

  const stateClasses = hasError
    ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200';

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-600"> *</span>}
        </label>
      )}

      <select
        id={selectId}
        ref={ref}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy}
        required={required}
        className={cn(baseClasses, sizeClasses[size], stateClasses, className)}
        onChange={(e) => {
          onChange?.(e);
          onValueChange?.(e.target.value);
        }}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

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

SelectDropdown.displayName = 'SelectDropdown';

export default SelectDropdown;
