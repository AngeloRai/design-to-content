module.exports = function (migration) {
  const navbar = migration
    .createContentType("navbar")
    .name("Navbar")
    .displayField("internalName")
    .description("Navigation bar component");

  navbar
    .createField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .required(true)
    .validations([
      {
        size: { max: 100 },
      },
    ]);

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
    ]);

  navbar
    .createField("navigationLinks")
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
    ]);

  navbar
    .createField("cta")
    .name("Call to Action")
    .type("Link")
    .linkType("Entry")
    .required(false)
    .validations([
      {
        linkContentType: ["cta"],
      },
    ]);

  navbar
    .createField("backgroundColor")
    .name("Background Color")
    .type("Symbol")
    .required(false)
    .validations([
      {
        in: [
          "neutral-dark",
          "brand-primary",
          "brand-accent",
          "brand-secondary",
          "surface-pure",
          "surface-soft",
        ],
      },
    ]);
};