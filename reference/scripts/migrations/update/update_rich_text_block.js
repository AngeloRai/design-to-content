/*
  Contentful Migration: Update Rich Text Block content type
  ID: richTextBlock
*/

module.exports = function (migration) {
  const richTextBlock = migration
    .editContentType("richTextBlock")
    .name("Module: Rich Text Block")
    .displayField("internalName")
    .description("Rich text content block with optional background color");

  richTextBlock
    .editField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .required(true)
    .validations([
      {
        size: { max: 100 },
      },
    ])
    .disabled(false)
    .omitted(false);

  richTextBlock
    .editField("copy")
    .name("Copy")
    .type("RichText")
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
        message: "Only specific rich text formatting is allowed",
      },
    ])
    .disabled(false)
    .omitted(false);

  richTextBlock
    .editField("backgroundColor")
    .name("Background Color")
    .type("Symbol")
    .required(false)
    .validations([
      {
        in: [
          "surface-pure",
          "surface-soft", 
          "brand-accent",
          "brand-secondary",
          "brand-primary",
          "neutral-dark",
        ],
      },
    ])
    .defaultValue({ "en-US": "surface-pure" })
    .disabled(false)
    .omitted(false);

  // Configure field controls
  richTextBlock.changeFieldControl("internalName", "builtin", "singleLine", {
    helpText: "Used internally to identify this rich text block"
  });

  richTextBlock.changeFieldControl("copy", "builtin", "richTextEditor", {
    helpText: "Rich text content with support for headings, lists, links, and embedded media"
  });

  richTextBlock.changeFieldControl("backgroundColor", "builtin", "dropdown", {
    helpText: "Background color for the rich text block"
  });
};