/*
  Contentful Migration: Update Layout content type
  ID: layout
*/

module.exports = function (migration) {
  const layout = migration
    .editContentType("layout")
    .name("Layout")
    .displayField("internalName")
    .description("Layout wrapper containing navbar and footer components");

  layout
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

  layout
    .editField("navbar")
    .name("Navbar")
    .type("Link")
    .linkType("Entry")
    .required(false)
    .validations([
      {
        linkContentType: ["navbar"],
      },
    ])
    .disabled(false)
    .omitted(false);

  layout
    .editField("footer")
    .name("Footer")
    .type("Link")
    .linkType("Entry")
    .required(false)
    .validations([
      {
        linkContentType: ["footer"],
      },
    ])
    .disabled(false)
    .omitted(false);

  // Configure field controls
  layout.changeFieldControl("internalName", "builtin", "singleLine", {
    helpText: "Used internally to identify this layout"
  });

  layout.changeFieldControl("navbar", "builtin", "entryLinkEditor", {
    helpText: "Select the navbar component for this layout"
  });

  layout.changeFieldControl("footer", "builtin", "entryLinkEditor", {
    helpText: "Select the footer component for this layout"
  });
};