/*
  Contentful Migration: Update Module Contact Form content type
  ID: moduleContactForm
*/

module.exports = function (migration) {
  const contactForm = migration
    .editContentType("moduleContactForm")
    .name("[Module] Contact Form")
    .description("Contact form module with customizable fields and visit showroom section")
    .displayField("internalName");

  contactForm
    .editField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .localized(false)
    .required(true)
    .validations([])
    .disabled(false)
    .omitted(false);

  contactForm
    .editField("heading")
    .name("Heading")
    .type("Symbol")
    .localized(true)
    .required(true)
    .validations([
      {
        size: {
          max: 100
        }
      }
    ])
    .defaultValue({ "en-US": "Get in Touch" })
    .disabled(false)
    .omitted(false);

  contactForm
    .editField("subheading")
    .name("Subheading")
    .type("Text")
    .localized(true)
    .required(false)
    .validations([
      {
        size: {
          max: 300
        }
      }
    ])
    .defaultValue({ "en-US": "Ready to find your perfect piano? We'd love to hear from you." })
    .disabled(false)
    .omitted(false);

  contactForm
    .editField("subjects")
    .name("Form Subjects")
    .type("Array")
    .localized(true)
    .required(true)
    .validations([
      {
        size: {
          min: 1,
          max: 10
        }
      }
    ])
    .items({
      type: "Symbol",
      validations: [
        {
          size: {
            max: 100
          }
        }
      ]
    })
    .disabled(false)
    .omitted(false);

  contactForm
    .editField("messagePlaceholder")
    .name("Message Placeholder")
    .type("Text")
    .localized(true)
    .required(false)
    .validations([
      {
        size: {
          max: 200
        }
      }
    ])
    .defaultValue({ "en-US": "Tell us about your piano needs, preferences, or any questions you have..." })
    .disabled(false)
    .omitted(false);

  contactForm
    .editField("buttonText")
    .name("Button Text")
    .type("Symbol")
    .localized(true)
    .required(false)
    .validations([
      {
        size: {
          max: 50
        }
      }
    ])
    .defaultValue({ "en-US": "Send Message" })
    .disabled(false)
    .omitted(false);

  contactForm
    .editField("businessInfoHeading")
    .name("Business Info Heading")
    .type("Symbol")
    .localized(true)
    .required(false)
    .validations([
      {
        size: {
          max: 100
        }
      }
    ])
    .defaultValue({ "en-US": "Visit Our Showroom" })
    .disabled(false)
    .omitted(false);

  contactForm
    .editField("addresses")
    .name("Addresses")
    .type("Array")
    .localized(true)
    .required(true)
    .validations([
      {
        size: {
          min: 1,
          max: 5
        }
      }
    ])
    .items({
      type: "Symbol",
      validations: [
        {
          size: {
            max: 300
          }
        }
      ]
    })
    .disabled(false)
    .omitted(false);

  contactForm
    .editField("phones")
    .name("Phone Numbers")
    .type("Array")
    .localized(true)
    .required(true)
    .validations([
      {
        size: {
          min: 1,
          max: 5
        }
      }
    ])
    .items({
      type: "Symbol",
      validations: [
        {
          size: {
            max: 50
          }
        }
      ]
    })
    .disabled(false)
    .omitted(false);

  contactForm
    .editField("schedule")
    .name("Business Schedule")
    .type("Text")
    .localized(true)
    .required(true)
    .validations([
      {
        size: {
          max: 500
        }
      }
    ])
    .disabled(false)
    .omitted(false);

  contactForm
    .editField("copy")
    .name("Additional Info Copy")
    .type("Text")
    .localized(true)
    .required(false)
    .validations([
      {
        size: {
          max: 500
        }
      }
    ])
    .disabled(false)
    .omitted(false);

  contactForm
    .editField("backgroundColor")
    .name("Background Color")
    .type("Symbol")
    .localized(false)
    .required(false)
    .validations([
      { 
        in: ["surface-pure", "surface-soft", "brand-accent", "brand-secondary", "brand-primary", "neutral-dark"] 
      }
    ])
    .defaultValue({ "en-US": "surface-pure" })
    .disabled(false)
    .omitted(false);

  contactForm
    .editField("redirectUrl")
    .name("Success Redirect URL")
    .type("Symbol")
    .localized(false)
    .required(false)
    .validations([
      {
        regexp: {
          pattern: "^\/.*$",
          flags: null
        }
      }
    ])
    .disabled(false)
    .omitted(false);
};