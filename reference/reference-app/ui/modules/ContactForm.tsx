import ContactFormClient from '../components/ContactFormClient'
import type { ContactFormProps } from '@/lib/contentful/types/fields'
import { generateGoogleMapsLink } from '@/lib/utils/maps'
import { getBrandBgClass, getContrastTextClass, getContrastSubtextClass, getContrastFormFieldClass, isDarkBackground } from '@/lib/utils/brandColors'
import { getLocale } from '@/lib/locale'

interface ContactFormModuleProps extends ContactFormProps {
  id?: string;
}

export default async function ContactForm({
  id = "contact-form",
  heading,
  subheading,
  backgroundColor,
  businessInfoHeading,
  addresses,
  phones,
  schedule,
  copy,
  redirectUrl,
}: ContactFormModuleProps) {
  const formspreeFormId = process.env.FORMSPREE_FORM_ID;
  const currentLocale = await getLocale();
  
  // Prepare styling classes for the client component
  const formFieldClasses = getContrastFormFieldClass(backgroundColor);
  const textClasses = getContrastTextClass(backgroundColor);

  const title = heading || "Get in Touch";
  const subtitle = subheading || "Ready to find your perfect piano? We'd love to hear from you.";
  const businessHeading = businessInfoHeading || "Visit Our Showroom";
  const businessAddresses = addresses || [];
  const businessPhones = phones || [];
  const businessSchedule = schedule || "";
  const additionalCopy = copy || "";

  return (
    <section 
      id={id}
      className={`w-full py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 ${getBrandBgClass(backgroundColor, 'bg-surface-pure')}`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Section Heading */}
        <div className="text-center mb-12">
          <h2 className={`font-heading text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4 ${getContrastTextClass(backgroundColor)}`}>
            {title}
          </h2>
          <p className={`font-body text-lg sm:text-xl max-w-2xl mx-auto ${getContrastSubtextClass(backgroundColor)}`}>
            {subtitle}
          </p>
        </div>

        {/* Contact Form */}
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Form - Client Component */}
          <ContactFormClient
            formId={formspreeFormId}
            successRedirectUrl={redirectUrl}
            formFieldClasses={formFieldClasses}
            textClasses={textClasses}
            locale={currentLocale}
          />

          {/* Business Information */}
          <div className="space-y-8">
            {/* Business Info Heading */}
            <div>
              <h3 className={`font-heading text-2xl sm:text-3xl mb-6 ${getContrastTextClass(backgroundColor)}`}>
                {businessHeading}
              </h3>

              <div className="space-y-6">
                {/* Addresses */}
                {businessAddresses.map((address, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div 
                      className="w-6 h-6 mt-0.5 rounded-full flex items-center justify-center bg-brand-primary flex-shrink-0"
                    >
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <a
                        href={generateGoogleMapsLink(address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${getContrastTextClass(backgroundColor)} hover:underline transition-colors cursor-pointer`}
                      >
                        {address}
                      </a>
                    </div>
                  </div>
                ))}

                {/* Phone Numbers */}
                {businessPhones && businessPhones.length > 0 && (
                  <div className="flex items-start space-x-3">
                    <div 
                      className="w-6 h-6 mt-0.5 rounded-full flex items-center justify-center bg-brand-primary flex-shrink-0"
                    >
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <div className={getContrastTextClass(backgroundColor)}>
                        {businessPhones.map((phone, index) => (
                          <div key={index}>
                            <a 
                              href={`tel:${phone.replace(/\D/g, '')}`}
                              className="hover:underline transition-colors"
                            >
                              {phone}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Business Schedule */}
                {businessSchedule && (
                  <div className="flex items-start space-x-3">
                    <div 
                      className="w-6 h-6 mt-0.5 rounded-full flex items-center justify-center bg-brand-primary flex-shrink-0"
                    >
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className={getContrastTextClass(backgroundColor)}>
                        {businessSchedule.split('\n').map((line, index) => (
                          <span key={index}>
                            {line}
                            {index < businessSchedule.split('\n').length - 1 && <br />}
                          </span>
                        ))}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {additionalCopy && (
              <div className={`p-6 rounded-2xl ${isDarkBackground(backgroundColor) ? 'bg-white/5' : 'bg-surface-soft'}`}>
                <p className={`text-sm leading-relaxed ${getContrastSubtextClass(backgroundColor)}`}>
                  {additionalCopy}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

