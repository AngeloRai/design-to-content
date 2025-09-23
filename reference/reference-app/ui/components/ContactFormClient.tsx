'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, ValidationError } from '@formspree/react'
import CTA from './CTA'
import { Input, Label, Textarea, Select } from './FormComponents'
import { getTranslation } from '@/lib/translations/contact-form'
import type { SupportedLocale } from '@/lib/locale-types'

interface ContactFormClientProps {
  formId: string | undefined;
  successRedirectUrl?: string;
  formFieldClasses: string;
  textClasses: string;
  locale: SupportedLocale;
}

export default function ContactFormClient({
  formId,
  successRedirectUrl,
  formFieldClasses,
  textClasses,
  locale,
}: ContactFormClientProps) {
  const [state, formspreeHandleSubmit] = useForm(formId || '');
  const router = useRouter();
  
  // Custom submit handler to ensure validation runs
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    
    // Check if form is valid using HTML5 validation
    if (!form.checkValidity()) {
      // Prevent default and let browser show validation
      e.preventDefault();
      e.stopPropagation();
      
      // Find first invalid field and focus it
      const firstInvalid = form.querySelector(':invalid') as HTMLElement;
      if (firstInvalid) {
        firstInvalid.focus();
        // Trigger validation display
        form.reportValidity();
      }
      return;
    }
    
    // If valid, proceed with Formspree submission
    formspreeHandleSubmit(e);
  };
  
  // Handle redirect after successful submission
  useEffect(() => {
    if (state.succeeded && successRedirectUrl) {
      router.push(successRedirectUrl);
    }
  }, [state.succeeded, successRedirectUrl, router]);
  
  const t = (key: Parameters<typeof getTranslation>[0]) => getTranslation(key, locale);

  if (!formId) {
    return (
      <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 font-body">
          Form configuration error - missing form ID
        </p>
      </div>
    );
  }

  if (state.succeeded) {
    return (
      <div className="text-center p-8 bg-green-50 border border-green-200 rounded-lg">
        <div className="mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-body-bold text-green-800 mb-2">
          {t('Thank You!')}
        </h3>
        <p className="text-green-600">
          {t('We\'ve received your message and will get back to you within 24 hours. Our team is excited to help you find the perfect piano.')}
        </p>
      </div>
    );
  }

  return (
    <form 
      onSubmit={handleSubmit}
      className="space-y-6"
      noValidate
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Name Field */}
        <div>
          <Label htmlFor="firstName" className={textClasses}>
            {t('First Name *')}
          </Label>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            required
            placeholder=""
            className={formFieldClasses}
          />
          <ValidationError 
            prefix="First Name" 
            field="firstName"
            errors={state.errors}
            className="text-red-500 text-sm mt-1"
          />
        </div>

        {/* Last Name Field */}
        <div>
          <Label htmlFor="lastName" className={textClasses}>
            {t('Last Name *')}
          </Label>
          <Input
            id="lastName"
            name="lastName"
            type="text"
            required
            placeholder=""
            className={formFieldClasses}
          />
          <ValidationError 
            prefix="Last Name" 
            field="lastName"
            errors={state.errors}
            className="text-red-500 text-sm mt-1"
          />
        </div>
      </div>

      {/* Email Field - Full Width */}
      <div>
        <Label htmlFor="email" className={textClasses}>
          {t('Email Address *')}
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder=""
          className={formFieldClasses}
        />
        <ValidationError 
          prefix="Email" 
          field="email"
          errors={state.errors}
          className="text-red-500 text-sm mt-1"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Phone Field */}
        <div>
          <Label htmlFor="phone" className={textClasses}>
            {t('Phone Number')}
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder=""
            className={formFieldClasses}
          />
          <ValidationError 
            prefix="Phone" 
            field="phone"
            errors={state.errors}
            className="text-red-500 text-sm mt-1"
          />
        </div>

        {/* Subject Field */}
        <div>
          <Label htmlFor="subject" className={textClasses}>
            {t('Subject *')}
          </Label>
          <Select
            id="subject"
            name="subject"
            required
            className={formFieldClasses}
          >
            <option value="">{t('Please select a subject')}</option>
            <option value="general">General Inquiry</option>
            <option value="lessons">Piano Lessons</option>
            <option value="tuning">Piano Tuning</option>
            <option value="other">Other</option>
          </Select>
          <ValidationError 
            prefix="Subject" 
            field="subject"
            errors={state.errors}
            className="text-red-500 text-sm mt-1"
          />
        </div>
      </div>

      {/* Message Field */}
      <div>
        <Label htmlFor="message" className={textClasses}>
          {t('Message *')}
        </Label>
        <Textarea
          id="message"
          name="message"
          required
          placeholder="Tell us about your piano needs, preferences, or any questions you have..."
          className={formFieldClasses}
        />
        <ValidationError 
          prefix="Message" 
          field="message"
          errors={state.errors}
          className="text-red-500 text-sm mt-1"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-center pt-4">
        <CTA
          variant="primary"
          type="submit"
          disabled={state.submitting}
          className="min-w-[200px] transform transition-transform duration-200 hover:scale-105 disabled:hover:scale-100 disabled:opacity-60"
        >
          {state.submitting ? t('Sending...') : (locale === 'pt-BR' ? 'Enviar Mensagem' : 'Send Message')}
        </CTA>
      </div>

      {/* Error Display */}
      {state.errors && Object.keys(state.errors).length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">
            There was a problem sending your message. Please check the fields and try again.
          </p>
        </div>
      )}
    </form>
  );
}