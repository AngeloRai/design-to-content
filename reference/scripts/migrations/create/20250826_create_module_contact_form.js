/*
  Contentful Migration: Create [Module] Contact Form content type
  Run via contentful-migration CLI.
*/

module.exports = function (migration) {
  const contactForm = migration
    .createContentType("moduleContactForm")
    .name("[Module] Contact Form")
    .description("Contact form module with customizable fields and visit showroom section")
    .displayField("internalName");

  contactForm
    .createField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .localized(false)
    .required(true)
    .validations([])
    .disabled(false)
    .omitted(false);

  contactForm
    .createField("heading")
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
    .createField("subheading")
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
    .createField("messagePlaceholder")
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
    .createField("subjects")
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
    .createField("buttonText")
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
    .createField("businessInfoHeading")
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
    .createField("addresses")
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
    .createField("phones")
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
    .createField("schedule")
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
    .createField("copy")
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
    .createField("backgroundColor")
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
    .createField("redirectUrl")
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


  // Field controls
  contactForm.changeFieldControl("internalName", "builtin", "singleLine", {
    helpText: "Used internally to identify this contact form module"
  });

  contactForm.changeFieldControl("heading", "builtin", "singleLine", {
    helpText: "Main heading for the contact form section (max 100 characters)"
  });

  contactForm.changeFieldControl("subheading", "builtin", "multipleLine", {
    helpText: "Subheading text below the main heading (max 300 characters)"
  });

  contactForm.changeFieldControl("messagePlaceholder", "builtin", "multipleLine", {
    helpText: "Placeholder text for the message textarea field"
  });

  contactForm.changeFieldControl("subjects", "builtin", "tagEditor", {
    helpText: "List of subject options for the contact form dropdown (1-10 items)"
  });

  contactForm.changeFieldControl("buttonText", "builtin", "singleLine", {
    helpText: "Text for the submit button (max 50 characters)"
  });

  contactForm.changeFieldControl("businessInfoHeading", "builtin", "singleLine", {
    helpText: "Heading for the business information section"
  });

  contactForm.changeFieldControl("addresses", "builtin", "tagEditor", {
    helpText: "Business addresses (1-5 locations) - each will automatically generate a clickable Google Maps link"
  });

  contactForm.changeFieldControl("phones", "builtin", "tagEditor", {
    helpText: "Phone numbers for the business (1-5 numbers)"
  });

  contactForm.changeFieldControl("schedule", "builtin", "multipleLine", {
    helpText: "Business hours and schedule information"
  });

  contactForm.changeFieldControl("copy", "builtin", "multipleLine", {
    helpText: "Additional information or promotional text (optional)"
  });

  contactForm.changeFieldControl("backgroundColor", "builtin", "dropdown", {
    helpText: "Background color for the contact form section"
  });

  contactForm.changeFieldControl("redirectUrl", "builtin", "singleLine", {
    helpText: "URL to redirect to after successful form submission (e.g., /message-received). Leave empty to show default success message."
  })

}