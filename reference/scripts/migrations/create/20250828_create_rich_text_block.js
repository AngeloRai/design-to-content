module.exports = function (migration) {
  const richTextBlock = migration
    .createContentType("richTextBlock")
    .name("Module: Rich Text Block")
    .displayField("internalName")
    .description("Rich text content block with optional background color");

  richTextBlock
    .createField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .required(true)
    .validations([
      {
        size: { max: 100 },
      },
    ]);

  richTextBlock
    .createField("copy")
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
    ]);

  richTextBlock
    .createField("backgroundColor")
    .name("Background Color")
    .type("Symbol")
    .required(false)
    .validations([
      {
        in: [
          "neutral-dark",
          "brand-primary",
          "brand-accent", // Fixed typo from TypeScript definition
          "brand-secondary",
          "surface-pure",
          "surface-soft",
        ],
      },
    ]);
};