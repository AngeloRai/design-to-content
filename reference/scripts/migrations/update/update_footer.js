/*
  Contentful Migration: Update Footer content type
  ID: footer
  - Updates logo field name from "Logo Light" to "Logo"
  - Adds backgroundColor field with brand color validations
  - Ensures all field validations are up to date
*/

module.exports = function (migration) {
  const footer = migration
    .editContentType("footer")
    .name("Footer")
    .displayField("internalName")
    .description("Footer with logo, links, and copyright information");

  footer
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

  // Update logo field name from "Logo Light" to "Logo"
  footer
    .editField("logo")
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

  footer
    .editField("socialShare")
    .name("Social Share Links")
    .type("Link")
    .linkType("Entry")
    .required(false)
    .validations([
      {
        linkContentType: ["componentLinks"],
      },
    ])
    .disabled(false)
    .omitted(false);

  footer
    .editField("slogan")
    .name("Slogan")
    .type("Text")
    .required(false)
    .validations([
      {
        size: { max: 500 },
      },
    ])
    .disabled(false)
    .omitted(false);

  footer
    .editField("links")
    .name("Footer Links")
    .type("Array")
    .required(false)
    .items({
      type: "Link",
      linkType: "Entry",
      validations: [
        {
          linkContentType: ["componentLinks"],
        },
      ],
    })
    .validations([
      {
        size: { min: 0, max: 4 },
      },
    ])
    .disabled(false)
    .omitted(false);

  footer
    .editField("copyrightMessage")
    .name("Copyright Message")
    .type("Symbol")
    .required(false)
    .validations([
      {
        size: { max: 200 },
      },
    ])
    .disabled(false)
    .omitted(false);

  footer
    .editField("copyrightLinks")
    .name("Copyright Links")
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
        size: { min: 0, max: 5 },
      },
    ])
    .disabled(false)
    .omitted(false);

  // Add backgroundColor field with brand colors
  footer
    .createField("backgroundColor")
    .name("Background Color")
    .type("Symbol")
    .localized(false)
    .required(false)
    .validations([
      {
        in: ["surface-pure", "surface-soft", "brand-accent", "brand-secondary", "brand-primary", "neutral-dark"]
      }
    ])
    .defaultValue({ "en-US": "neutral-dark" })
    .disabled(false)
    .omitted(false);

  // Configure field controls
  footer.changeFieldControl("internalName", "builtin", "singleLine", {
    helpText: "Used internally to identify this footer component"
  });

  footer.changeFieldControl("logo", "builtin", "assetLinkEditor", {
    helpText: "Footer logo image"
  });

  footer.changeFieldControl("socialShare", "builtin", "entryLinkEditor", {
    helpText: "Social media links component"
  });

  footer.changeFieldControl("slogan", "builtin", "multipleLine", {
    helpText: "Footer slogan or tagline (max 500 characters)"
  });

  footer.changeFieldControl("links", "builtin", "entryLinksEditor", {
    helpText: "Footer link groups (max 4)"
  });

  footer.changeFieldControl("copyrightMessage", "builtin", "singleLine", {
    helpText: "Copyright phrase (max 200 characters)"
  });

  footer.changeFieldControl("copyrightLinks", "builtin", "entryLinksEditor", {
    helpText: "Links in copyright section (e.g., Privacy Policy, Terms)"
  });

  footer.changeFieldControl("backgroundColor", "builtin", "dropdown", {
    helpText: "Background color for the footer"
  });
};