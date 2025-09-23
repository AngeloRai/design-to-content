/*
  Contentful Migration: Update Component Card content type
  ID: componentCard
*/

module.exports = function (migration) {
  const card = migration
    .editContentType("componentCard")
    .name("[Component] Card")
    .description("Card component for displaying content with icon, title, and CTA")
    .displayField("internalName");

  card
    .editField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .localized(false)
    .required(true)
    .validations([])
    .disabled(false)
    .omitted(false);

  card
    .editField("heading")
    .name("Heading")
    .type("Symbol")
    .localized(true)
    .required(true)
    .validations([
      {
        size: {
          max: 100
        }
      }
    ])
    .disabled(false)
    .omitted(false);

  card
    .editField("subheading")
    .name("Subheading")
    .type("Text")
    .localized(true)
    .required(true)
    .validations([
      {
        size: {
          max: 500
        }
      }
    ])
    .disabled(false)
    .omitted(false);

  card
    .editField("icon")
    .name("Icon")
    .type("Symbol")
    .localized(false)
    .required(true)
    .validations([
      { 
        in: ["chevronLeft", "chevronRight", "craftsman", "facebook", "grandPiano", "heart", "instagram", "menu", "music", "piano", "playingPiano", "service", "twitter", "x", "youtube"] 
      }
    ])
    .defaultValue({ "en-US": "music" })
    .disabled(false)
    .omitted(false);

  card
    .editField("backgroundColor")
    .name("Background Color")
    .type("Symbol")
    .localized(false)
    .required(false)
    .validations([
      { 
        in: ["surface-pure", "surface-soft", "brand-accent", "brand-secondary", "brand-primary", "neutral-dark"] 
      }
    ])
    .defaultValue({ "en-US": "surface-pure" })
    .disabled(false)
    .omitted(false);

  card
    .editField("cta")
    .name("CTA")
    .type("Link")
    .localized(false)
    .required(false)
    .validations([
      {
        linkContentType: ["cta"]
      }
    ])
    .linkType("Entry")
    .disabled(false)
    .omitted(false);

  // Configure field controls
  card.changeFieldControl("internalName", "builtin", "singleLine", {
    helpText: "Used internally to identify this card"
  });

  card.changeFieldControl("heading", "builtin", "singleLine", {
    helpText: "Card heading displayed prominently"
  });

  card.changeFieldControl("subheading", "builtin", "multipleLine", {
    helpText: "Card subheading/description text (max 500 characters)"
  });

  card.changeFieldControl("icon", "builtin", "dropdown", {
    helpText: "Select the icon to display in the card"
  });

  card.changeFieldControl("backgroundColor", "builtin", "dropdown", {
    helpText: "Background color for the card"
  });

  card.changeFieldControl("cta", "builtin", "entryLinkEditor", {
    helpText: "Optional CTA button for the card"
  });
};