/*
  Contentful Migration: Update [Module] Image Carousel content type
  ID: moduleImageCarousel
*/

module.exports = function (migration) {
  const carousel = migration
    .editContentType("moduleImageCarousel")
    .name("[Module] Image Carousel")
    .description("Carousel for a set of images with optional caption and CTA")
    .displayField("internalName");

  carousel
    .editField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .localized(false)
    .required(true)
    .validations([])
    .disabled(false)
    .omitted(false);

  carousel
    .editField("heading")
    .name("Heading")
    .type("Symbol")
    .localized(true)
    .required(false)
    .validations([])
    .disabled(false)
    .omitted(false);

  carousel
    .editField("subheading")
    .name("Subheading")
    .type("Text")
    .localized(true)
    .required(false)
    .validations([{ size: { max: 2000 } }])
    .disabled(false)
    .omitted(false);

  carousel
    .editField("images")
    .name("Images")
    .type("Array")
    .localized(false)
    .required(true)
    .validations([])
    .disabled(false)
    .omitted(false)
    .items({ type: "Link", linkType: "Asset" });

  carousel
    .editField("autoplay")
    .name("Autoplay")
    .type("Boolean")
    .localized(false)
    .required(false)
    .validations([])
    .defaultValue({ "en-US": false })
    .disabled(false)
    .omitted(false);

  carousel
    .editField("autoplayInterval")
    .name("Autoplay Interval (ms)")
    .type("Integer")
    .localized(false)
    .required(false)
    .validations([])
    .defaultValue({ "en-US": 5000 })
    .disabled(false)
    .omitted(false);

  carousel
    .editField("navigation")
    .name("Navigation")
    .type("Symbol")
    .localized(false)
    .required(false)
    .validations([{ in: ["arrows", "dots", "both", "none"] }])
    .defaultValue({ "en-US": "both" })
    .disabled(false)
    .omitted(false);

  carousel
    .editField("cta")
    .name("CTA")
    .type("Link")
    .localized(false)
    .required(false)
    .validations([{ linkContentType: ["cta"] }])
    .disabled(false)
    .omitted(false)
    .linkType("Entry");

  carousel.changeFieldControl("internalName", "builtin", "singleLine", {
    helpText: "Used internally to identify this carousel",
  });

  carousel.changeFieldControl("heading", "builtin", "singleLine", {
    helpText: "Optional heading shown above the carousel",
  });

  carousel.changeFieldControl("subheading", "builtin", "multipleLine", {
    helpText: "Optional long text (max 2000 characters)",
  });

  carousel.changeFieldControl("images", "builtin", "assetGallery", {
    helpText: "Upload or select images for the carousel",
  });

  carousel.changeFieldControl("autoplay", "builtin", "boolean", {
    helpText: "Toggle autoplay",
    trueLabel: "Autoplay",
    falseLabel: "Manual",
  });

  carousel.changeFieldControl("navigation", "builtin", "dropdown", {
    helpText: "Navigation display for the carousel",
  });

  carousel.changeFieldControl("cta", "builtin", "entryLinkEditor", {
    helpText: "Optional CTA that applies to the carousel",
  });
};
