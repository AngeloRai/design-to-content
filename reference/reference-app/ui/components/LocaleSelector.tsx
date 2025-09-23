'use client';

import { updateLocale } from '@/app/actions/locale';
import { type SupportedLocale } from '@/lib/locale-types';
import { useRef } from 'react';

interface LocaleSelectorProps {
  currentLocale: SupportedLocale;
  variant?: 'default' | 'footer';
  className?: string;
}

// Locale options with flags and abbreviations
const LOCALE_OPTIONS: Record<SupportedLocale, { flag: string; abbr: string }> = {
  'en-US': { flag: '🇺🇸', abbr: 'EN' },
  'pt-BR': { flag: '🇧🇷', abbr: 'PT' }
};

export default function LocaleSelector({ 
  currentLocale, 
  variant = 'default',
  className = '' 
}: LocaleSelectorProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleLocaleChange = async () => {
    // Submit the form when select changes
    const formData = new FormData(formRef.current!);
    await updateLocale(formData);
    
    // The revalidatePath in the server action will refresh the page with new locale
    // No need for a hard reload since we have locale-specific preloaded data now
  };

  const baseStyles = variant === 'footer' 
    ? "bg-transparent text-white/70 border border-white/20 hover:border-white/40 focus:border-white/60"
    : "bg-white text-brand-primary border border-brand-primary/20";

  return (
    <form ref={formRef} className={`inline-block ${className}`}>
      <label htmlFor="locale-select" className="sr-only">
        Select Language
      </label>
      <select
        id="locale-select"
        name="locale"
        defaultValue={currentLocale}
        onChange={handleLocaleChange}
        className={`
          px-3 py-2 rounded-lg text-sm font-body
          transition-all duration-200 cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-offset-2
          ${baseStyles}
          ${variant === 'footer' ? 'focus:ring-white/50' : 'focus:ring-brand-secondary'}
        `}
        aria-label="Select language"
      >
        {Object.entries(LOCALE_OPTIONS).map(([locale, { flag, abbr }]) => (
          <option key={locale} value={locale}>
            {flag} {abbr}
          </option>
        ))}
      </select>
    </form>
  );
}