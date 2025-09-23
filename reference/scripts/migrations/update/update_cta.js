/*
  Contentful Migration: Update existing [Component] CTA content type
  Ensures schema matches desired field configuration.
*/

module.exports = function (migration) {
  const cta = migration
    .editContentType("cta")
    .name("[Component] CTA")
    .description("")
    .displayField("internalName");

  cta
    .editField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .localized(false)
    .required(true)
    .validations([])
    .disabled(false)
    .omitted(false);

  cta
    .editField("label")
    .name("Label")
    .type("Symbol")
    .localized(true)
    .required(false)
    .validations([])
    .disabled(false)
    .omitted(false);

  cta
    .editField("url")
    .name("URL")
    .type("Symbol")
    .localized(false)
    .required(false)
    .validations([])
    .disabled(false)
    .omitted(false);

  cta
    .editField("variant")
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
    .editField("icon")
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
    .editField("size")
    .name("Size")
    .type("Symbol")
    .localized(false)
    .required(false)
    .validations([{ in: ["small", "medium", "large"] }])
    .defaultValue({ "en-US": "medium" })
    .disabled(false)
    .omitted(false);

  cta
    .editField("external")
    .name("External")
    .type("Boolean")
    .localized(false)
    .required(false)
    .validations([])
    .defaultValue({ "en-US": false })
    .disabled(false)
    .omitted(false);

  cta
    .editField("disabled")
    .name("Disabled")
    .type("Boolean")
    .localized(false)
    .required(false)
    .validations([])
    .defaultValue({ "en-US": false })
    .disabled(false)
    .omitted(false);

  cta.changeFieldControl("icon", "builtin", "dropdown", {
    helpText: "playingPiano",
  });
};
