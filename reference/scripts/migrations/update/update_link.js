/*
  Contentful Migration: Update existing [Component] Link content type
  Ensures schema matches desired field configuration.
*/

module.exports = function (migration) {
  const link = migration
    .editContentType("link")
    .name("[Component] Link")
    .description("")
    .displayField("internalName");

  link
    .editField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .localized(false)
    .required(true)
    .validations([])
    .disabled(false)
    .omitted(false);

  link
    .editField("label")
    .name("Label")
    .type("Symbol")
    .localized(true)
    .required(false)
    .validations([])
    .disabled(false)
    .omitted(false);

  link
    .editField("url")
    .name("URL")
    .type("Symbol")
    .localized(false)
    .required(false)
    .validations([])
    .disabled(false)
    .omitted(false);
};
