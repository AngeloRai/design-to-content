/*
  Contentful Migration: Update Component Links content type
  ID: componentLinks
*/

module.exports = function (migration) {
  const componentLinks = migration
    .editContentType("componentLinks")
    .name("Component: Links")
    .displayField("internalName")
    .description("A collection of links (CTAs or simple links)");

  componentLinks
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

  componentLinks
    .editField("title")
    .name("Title")
    .type("Symbol")
    .required(false)
    .validations([
      {
        size: { max: 100 },
      },
    ])
    .disabled(false)
    .omitted(false);

  componentLinks
    .editField("links")
    .name("Links")
    .type("Array")
    .required(false)
    .items({
      type: "Link",
      linkType: "Entry",
      validations: [
        {
          linkContentType: ["cta", "link"],
        },
      ],
    })
    .validations([
      {
        size: { min: 0, max: 10 },
      },
    ])
    .disabled(false)
    .omitted(false);

  // Configure field controls
  componentLinks.changeFieldControl("internalName", "builtin", "singleLine", {
    helpText: "Used internally to identify this links component"
  });

  componentLinks.changeFieldControl("title", "builtin", "singleLine", {
    helpText: "Optional title for the links group"
  });

  componentLinks.changeFieldControl("links", "builtin", "entryLinksEditor", {
    helpText: "List of links (CTAs or simple links, max 10)"
  });
};