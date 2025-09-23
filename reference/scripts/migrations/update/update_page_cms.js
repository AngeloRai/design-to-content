/*
  Contentful Migration: Update Page CMS content type
  ID: pageCms
*/

module.exports = function (migration) {
  const page = migration
    .editContentType("pageCms")
    .name("[Page] CMS")
    .description("")
    .displayField("internalName");

  page
    .editField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .localized(false)
    .required(true)
    .validations([])
    .disabled(false)
    .omitted(false);

  page
    .editField("slug")
    .name("Slug")
    .type("Symbol")
    .localized(false)
    .required(true)
    .validations([])
    .disabled(false)
    .omitted(false);

  page
    .editField("contentModules")
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

  page
    .editField("seo")
    .name("SEO")
    .type("Link")
    .linkType("Entry")
    .localized(false)
    .required(false)
    .validations([
      {
        linkContentType: ["componentSeo"]
      }
    ])
    .disabled(false)
    .omitted(false);

  // Configure field controls
  page.changeFieldControl("internalName", "builtin", "singleLine", {
    helpText: "Used internally to identify this page"
  });

  page.changeFieldControl("slug", "builtin", "singleLine", {
    helpText: "URL slug for this page"
  });

  page.changeFieldControl("contentModules", "builtin", "entryLinksEditor", {
    helpText: "Select content modules to include on this page (hero, image text, grid, carousel, contact form, rich text, etc.)"
  });

  page.changeFieldControl("seo", "builtin", "entryLinkEditor", {
    helpText: "SEO information for this page"
  });
};