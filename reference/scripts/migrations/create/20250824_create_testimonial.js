/*
  Contentful Migration: Create [Component] Testimonial content type
  Run via contentful-migration CLI.
*/

module.exports = function (migration) {
  const testimonial = migration
    .createContentType("componentTestimonial")
    .name("[Component] Testimonial")
    .description("Testimonial component for displaying customer reviews and feedback")
    .displayField("internalName");

  testimonial
    .createField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .localized(false)
    .required(true)
    .validations([])
    .disabled(false)
    .omitted(false);

  testimonial
    .createField("name")
    .name("Name")
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
    .disabled(false)
    .omitted(false);

  testimonial
    .createField("role")
    .name("Role")
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
    .disabled(false)
    .omitted(false);

  testimonial
    .createField("testimonial")
    .name("Testimonial")
    .type("Text")
    .localized(true)
    .required(true)
    .validations([
      {
        size: {
          max: 1000
        }
      }
    ])
    .disabled(false)
    .omitted(false);

  testimonial
    .createField("showRating")
    .name("Show Rating")
    .type("Boolean")
    .localized(false)
    .required(false)
    .validations([])
    .defaultValue({ "en-US": false })
    .disabled(false)
    .omitted(false);

  testimonial
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

  // Configure field controls
  testimonial.changeFieldControl("internalName", "builtin", "singleLine", {
    helpText: "Used internally to identify this testimonial"
  });

  testimonial.changeFieldControl("name", "builtin", "singleLine", {
    helpText: "Customer or reviewer name"
  });

  testimonial.changeFieldControl("role", "builtin", "singleLine", {
    helpText: "Optional role or title of the reviewer"
  });

  testimonial.changeFieldControl("testimonial", "builtin", "multipleLine", {
    helpText: "The testimonial text (max 1000 characters)"
  });

  testimonial.changeFieldControl("showRating", "builtin", "boolean", {
    helpText: "Toggle to show 5-star rating",
    trueLabel: "Show rating",
    falseLabel: "Hide rating"
  });

  testimonial.changeFieldControl("backgroundColor", "builtin", "dropdown", {
    helpText: "Background color for the testimonial card"
  });
};