/*
  Contentful Migration: Create [Page] CMS content type
  ID: pageCms
*/

module.exports = function (migration) {
  const page = migration
    .createContentType("pageCms")
    .name("[Page] CMS")
    .description("")
    .displayField("internalName");

  page
    .createField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .localized(false)
    .required(true)
    .validations([])
    .disabled(false)
    .omitted(false);

  page
    .createField("slug")
    .name("Slug")
    .type("Symbol")
    .localized(false)
    .required(true)
    .validations([])
    .disabled(false)
    .omitted(false);

  // Array of references to entries (many references)
  page
    .createField("contentModules")
    .name("Content Modules")
    .type("Array")
    .items({ 
      type: "Link", 
      linkType: "Entry", 
      validations: [
        {
          linkContentType: [
            "moduleContactForm",
            "moduleGrid", 
            "moduleHero",
            "moduleImageCarousel",
            "moduleImageText",
            "richTextBlock"
          ]
        }
      ] 
    })
    .localized(false)
    .required(false)
    .validations([])
    .disabled(false)
    .omitted(false);

  // Single reference to SEO entry
  page
    .createField("seo")
    .name("SEO")
    .type("Link")
    .linkType("Entry")
    .localized(false)
    .required(false)
    .validations([
      {
        linkContentType: ["componentSeo"],
      },
    ])
    .disabled(false)
    .omitted(false);

  page.changeFieldControl("contentModules", "builtin", "entryLinksEditor", {
    helpText:
      "Select content modules to include on this page (hero, image text, grid, carousel, contact form, rich text, etc.)",
  });
};
