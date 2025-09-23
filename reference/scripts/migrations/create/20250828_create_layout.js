module.exports = function (migration) {
  const layout = migration
    .createContentType("layout")
    .name("Layout")
    .displayField("internalName")
    .description("Layout wrapper containing navbar and footer components");

  layout
    .createField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .required(true)
    .validations([
      {
        size: { max: 100 },
      },
    ]);

  layout
    .createField("navbar")
    .name("Navbar")
    .type("Link")
    .linkType("Entry")
    .required(false)
    .validations([
      {
        linkContentType: ["navbar"],
      },
    ]);

  layout
    .createField("footer")
    .name("Footer")
    .type("Link")
    .linkType("Entry")
    .required(false)
    .validations([
      {
        linkContentType: ["footer"],
      },
    ]);
};