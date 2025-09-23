module.exports = function (migration) {
  const footer = migration
    .createContentType("footer")
    .name("Footer")
    .displayField("internalName")
    .description("Footer with logo, links, and copyright information");

  footer
    .createField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .required(true)
    .validations([
      {
        size: { max: 100 },
      },
    ]);

  footer
    .createField("logo")
    .name("Logo")
    .type("Link")
    .linkType("Asset")
    .required(false)
    .validations([
      {
        linkMimetypeGroup: ["image"],
      },
    ]);

  footer
    .createField("socialShare")
    .name("Social Share Links")
    .type("Link")
    .linkType("Entry")
    .required(false)
    .validations([
      {
        linkContentType: ["componentLinks"],
      },
    ]);

  footer
    .createField("slogan")
    .name("Slogan")
    .type("Text")
    .required(false)
    .validations([
      {
        size: { max: 500 },
      },
    ]);

  footer
    .createField("links")
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
    ]);

  footer
    .createField("copyrightMessage")
    .name("Copyright Message")
    .type("Symbol")
    .required(false)
    .validations([
      {
        size: { max: 200 },
      },
    ]);

  footer
    .createField("copyrightLinks")
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
    ]);
};