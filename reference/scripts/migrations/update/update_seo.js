/*
  Contentful Migration: Update SEO content type
  ID: seoContent
*/

module.exports = function (migration) {
  const seo = migration
    .editContentType("componentSeo")
    .name("[Component] SEO")
    .description("SEO content type with common seo required fields")
    .displayField("title");

  seo
    .createField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .localized(false)
    .required(true)
    .validations([])
    .disabled(false)
    .omitted(false);

  seo
    .editField("title")
    .name("Title")
    .type("Text")
    .localized(true)
    .required(false)
    .validations([])
    .disabled(false)
    .omitted(false);

  seo
    .editField("description")
    .name("Description")
    .type("Text")
    .localized(true)
    .required(false)
    .validations([])
    .disabled(false)
    .omitted(false);

  seo
    .editField("ogTitle")
    .name("Open Graph Title")
    .type("Text")
    .localized(false)
    .required(false)
    .validations([])
    .disabled(false)
    .omitted(false);

  seo
    .editField("ogDescription")
    .name("Open Graph Description")
    .type("Text")
    .localized(false)
    .required(false)
    .validations([])
    .disabled(false)
    .omitted(false);

  seo
    .editField("ogImage")
    .name("Open Graph Image")
    .type("Link")
    .localized(false)
    .required(false)
    .validations([])
    .disabled(false)
    .omitted(false)
    .linkType("Asset");
};
