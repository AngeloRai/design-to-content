/*
  Contentful Migration: Create [Component] CTA content type
  Run via contentful-migration CLI.
*/

module.exports = function (migration) {
  const cta = migration
    .createContentType("cta")
    .name("[Component] CTA")
    .description("")
    .displayField("internalName");

  cta
    .createField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .localized(false)
    .required(true)
    .validations([])
    .disabled(false)
    .omitted(false);

  cta
    .createField("label")
    .name("Label")
    .type("Symbol")
    .localized(true)
    .required(false)
    .validations([])
    .disabled(false)
    .omitted(false);

  cta
    .createField("url")
    .name("URL")
    .type("Symbol")
    .localized(false)
    .required(false)
    .validations([])
    .disabled(false)
    .omitted(false);

  cta
    .createField("variant")
    .name("Variant")
    .type("Symbol")
    .localized(false)
    .required(false)
    .validations([
      {
        in: ["primary", "secondary", "outline", "outline-dark", "ghost", "ghost-dark", "icon", "icon-rounded"],
      },
    ])
    .defaultValue({ "en-US": "primary" })
    .disabled(false)
    .omitted(false);

  cta
    .createField("icon")
    .name("Icon")
    .type("Symbol")
    .localized(false)
    .required(false)
    .validations([
      {
        in: [
          "music",
          "craftsman",
          "service",
          "heart",
          "piano",
          "grandPiano",
          "playingPiano",
          "instagram",
          "facebook",
          "youtube",
        ],
      },
    ])
    .disabled(false)
    .omitted(false);

  cta
    .createField("size")
    .name("Size")
    .type("Symbol")
    .localized(false)
    .required(false)
    .validations([{ in: ["small", "medium", "large"] }])
    .defaultValue({ "en-US": "medium" })
    .disabled(false)
    .omitted(false);

  cta
    .createField("external")
    .name("External")
    .type("Boolean")
    .localized(false)
    .required(false)
    .validations([])
    .defaultValue({ "en-US": false })
    .disabled(false)
    .omitted(false);

  cta
    .createField("disabled")
    .name("Disabled")
    .type("Boolean")
    .localized(false)
    .required(false)
    .validations([])
    .defaultValue({ "en-US": false })
    .disabled(false)
    .omitted(false);

  cta.changeFieldControl("icon", "builtin", "dropdown", {
    helpText:
      "Optional icon for icon variant. Icon will only be displayed if the variant is set to 'icon'.",
  });
};
