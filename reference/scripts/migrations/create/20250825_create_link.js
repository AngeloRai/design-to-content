/*
  Contentful Migration: Create [Component] Link content type
  Run via contentful-migration CLI.
*/

module.exports = function (migration) {
  const link = migration
    .createContentType("link")
    .name("[Component] Link")
    .description("")
    .displayField("internalName");

  link
    .createField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .localized(false)
    .required(true)
    .validations([])
    .disabled(false)
    .omitted(false);

  link
    .createField("label")
    .name("Label")
    .type("Symbol")
    .localized(true)
    .required(false)
    .validations([])
    .disabled(false)
    .omitted(false);

  link
    .createField("url")
    .name("URL")
    .type("Symbol")
    .localized(false)
    .required(false)
    .validations([])
    .disabled(false)
    .omitted(false);
};
