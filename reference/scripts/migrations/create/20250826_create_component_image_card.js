/*
  Contentful Migration: Create [Component] Image Card content type
  Run via contentful-migration CLI.
*/

module.exports = function (migration) {
  const imageCard = migration
    .createContentType("componentImageCard")
    .name("[Component] Image Card")
    .description("Image card component for displaying content with image, heading, description, and optional CTA")
    .displayField("internalName");

  imageCard
    .createField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .localized(false)
    .required(true)
    .validations([])
    .disabled(false)
    .omitted(false);

  imageCard
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
    .disabled(false)
    .omitted(false);

  imageCard
    .createField("description")
    .name("Description")
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

  imageCard
    .createField("image")
    .name("Image")
    .type("Link")
    .localized(false)
    .required(false)
    .validations([
      {
        linkMimetypeGroup: ["image"]
      }
    ])
    .linkType("Asset")
    .disabled(false)
    .omitted(false);

  imageCard
    .createField("cta")
    .name("CTA")
    .type("Link")
    .localized(false)
    .required(false)
    .validations([
      {
        linkContentType: ["cta"]
      }
    ])
    .linkType("Entry")
    .disabled(false)
    .omitted(false);

  imageCard
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

  imageCard.changeFieldControl("internalName", "builtin", "singleLine", {
    helpText: "Used internally to identify this image card"
  });

  imageCard.changeFieldControl("heading", "builtin", "singleLine", {
    helpText: "Card heading displayed prominently (max 100 characters)"
  });

  imageCard.changeFieldControl("description", "builtin", "multipleLine", {
    helpText: "Description text that appears on hover (max 500 characters)"
  });

  imageCard.changeFieldControl("image", "builtin", "assetLinkEditor", {
    helpText: "Image to display in the card"
  });

  imageCard.changeFieldControl("cta", "builtin", "entryLinkEditor", {
    helpText: "Optional CTA button for the card"
  });

  imageCard.changeFieldControl("backgroundColor", "builtin", "dropdown", {
    helpText: "Background color for the card"
  });
};