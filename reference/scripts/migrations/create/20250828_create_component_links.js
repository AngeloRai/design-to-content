module.exports = function (migration) {
  const componentLinks = migration
    .createContentType("componentLinks")
    .name("Component: Links")
    .displayField("internalName")
    .description("A collection of links (CTAs or simple links)");

  componentLinks
    .createField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .required(true)
    .validations([
      {
        size: { max: 100 },
      },
    ]);

  componentLinks
    .createField("title")
    .name("Title")
    .type("Symbol")
    .required(false)
    .validations([
      {
        size: { max: 100 },
      },
    ]);

  componentLinks
    .createField("links")
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
    ]);
};