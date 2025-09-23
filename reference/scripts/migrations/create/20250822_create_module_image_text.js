/*
  Contentful Migration: Create [Module] Image Text content type
  ID: moduleImageText
*/

module.exports = function (migration) {
  const moduleImageText = migration
    .createContentType("moduleImageText")
    .name("[Module] Image Text")
    .description("")
    .displayField("internalName");

  moduleImageText
    .createField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .localized(false)
    .required(true)
    .validations([])
    .disabled(false)
    .omitted(false);

  moduleImageText
    .createField("heading")
    .name("Heading")
    .type("Symbol")
    .localized(true)
    .required(false)
    .validations([])
    .disabled(false)
    .omitted(false);

  moduleImageText
    .createField("subheading")
    .name("Subheading")
    .type("RichText")
    .localized(true)
    .required(false)
    .validations([
      {
        enabledNodeTypes: [
          "heading-1",
          "heading-2",
          "heading-3",
          "heading-4",
          "heading-5",
          "heading-6",
          "ordered-list",
          "unordered-list",
          "hr",
          "blockquote",
          "embedded-entry-block",
          "embedded-asset-block",
          "hyperlink",
          "entry-hyperlink",
          "asset-hyperlink",
          "embedded-entry-inline",
        ],
        message:
          "Only heading, lists, hr, quote, block/inline entries, assets and links are allowed",
      },
      {
        enabledMarks: ["bold", "italic", "underline", "code"],
      },
    ])
    .disabled(false)
    .omitted(false);

  moduleImageText
    .createField("image")
    .name("Image")
    .type("Link")
    .localized(false)
    .required(false)
    .validations([])
    .disabled(false)
    .omitted(false)
    .linkType("Asset");

  moduleImageText
    .createField("imagePosition")
    .name("Image Position")
    .type("Symbol")
    .localized(false)
    .required(false)
    .validations([{ in: ["left", "right", "overlay"] }])
    .defaultValue({ "en-US": "left" })
    .disabled(false)
    .omitted(false);

  moduleImageText
    .createField("backgroundColor")
    .name("Background Color")
    .type("Symbol")
    .localized(false)
    .required(false)
    .validations([])
    .disabled(false)
    .omitted(false);

  moduleImageText
    .createField("primaryCta")
    .name("Primary CTA")
    .type("Link")
    .localized(false)
    .required(false)
    .validations([{ linkContentType: ["cta"] }])
    .disabled(false)
    .omitted(false)
    .linkType("Entry");

  moduleImageText
    .createField("secondaryCta")
    .name("Secondary CTA")
    .type("Link")
    .localized(false)
    .required(false)
    .validations([{ linkContentType: ["cta"] }])
    .disabled(false)
    .omitted(false)
    .linkType("Entry");
};
