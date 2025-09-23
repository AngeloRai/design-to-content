/*
  Contentful Migration: Update Navbar content type
  ID: navbar
  - Consolidates logoLight and logoDark into single logo field
  - Ensures all field validations are up to date
  - Updates backgroundColor with proper brand colors
*/

module.exports = function (migration) {
  const navbar = migration
    .editContentType("navbar")
    .name("Navbar")
    .displayField("internalName")
    .description("Navigation bar component");

  navbar
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

  // Create single logo field
  navbar
    .createField("logo")
    .name("Logo")
    .type("Link")
    .linkType("Asset")
    .required(false)
    .validations([
      {
        linkMimetypeGroup: ["image"],
      },
    ])
    .disabled(false)
    .omitted(false);

  navbar
    .editField("navigationLinks")
    .name("Navigation Links")
    .type("Array")
    .required(false)
    .items({
      type: "Link",
      linkType: "Entry",
      validations: [
        {
          linkContentType: ["link"],
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

  navbar
    .editField("cta")
    .name("Call to Action")
    .type("Link")
    .linkType("Entry")
    .required(false)
    .validations([
      {
        linkContentType: ["cta"],
      },
    ])
    .disabled(false)
    .omitted(false);

  navbar
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

  // Move logo field to proper position (after internalName)
  navbar.moveField("logo").afterField("internalName");

  // Configure field controls
  navbar.changeFieldControl("internalName", "builtin", "singleLine", {
    helpText: "Used internally to identify this navbar",
  });

  navbar.changeFieldControl("logo", "builtin", "assetLinkEditor", {
    helpText: "Logo image for the navbar",
  });

  navbar.changeFieldControl("navigationLinks", "builtin", "entryLinksEditor", {
    helpText: "Navigation menu links (max 10)",
  });

  navbar.changeFieldControl("cta", "builtin", "entryLinkEditor", {
    helpText: "Call to action button",
  });

  navbar.changeFieldControl("backgroundColor", "builtin", "dropdown", {
    helpText: "Background color for the navbar",
  });
};