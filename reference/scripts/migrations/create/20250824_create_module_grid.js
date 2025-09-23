/*
  Contentful Migration: Create [Module] Grid content type
  ID: moduleGrid
*/

module.exports = function (migration) {
  const grid = migration
    .createContentType("moduleGrid")
    .name("[Module] Grid")
    .description(
      "Grid layout to display a collection of component entries (cards, testimonials, etc.)"
    )
    .displayField("internalName");

  grid
    .createField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .localized(false)
    .required(true)
    .validations([])
    .disabled(false)
    .omitted(false);

  grid
    .createField("heading")
    .name("Heading")
    .type("Symbol")
    .localized(true)
    .required(false)
    .validations([])
    .disabled(false)
    .omitted(false);

  grid
    .createField("subheading")
    .name("Subheading")
    .type("Text")
    .localized(true)
    .required(false)
    .validations([
      {
        size: { max: 2000 },
      },
    ])
    .disabled(false)
    .omitted(false);

  // columns field intentionally omitted — layout controlled by design and number of items

  grid
    .createField("items")
    .name("Items")
    .type("Array")
    .localized(false)
    .required(false)
    .validations([])
    .disabled(false)
    .omitted(false)
    .items({
      type: "Link",
      validations: [
        { linkContentType: ["componentCard", "componentTestimonial"] },
      ],
      linkType: "Entry",
    });

  grid
    .createField("backgroundColor")
    .name("Background Color")
    .type("Symbol")
    .localized(false)
    .required(false)
    .validations([{ in: ["surface-pure", "surface-soft", "brand-accent", "brand-secondary", "brand-primary", "neutral-dark"] }])
    .defaultValue({ "en-US": "surface-pure" })
    .disabled(false)
    .omitted(false);

  grid
    .createField("cta")
    .name("CTA")
    .type("Link")
    .localized(false)
    .required(false)
    .validations([{ linkContentType: ["cta"] }])
    .disabled(false)
    .omitted(false)
    .linkType("Entry");

  // single CTA reference only (cta above)

  grid.changeFieldControl("internalName", "builtin", "singleLine", {
    helpText: "Used internally to identify this grid",
  });

  grid.changeFieldControl("heading", "builtin", "singleLine", {
    helpText: "Optional heading for the grid",
  });

  grid.changeFieldControl("subheading", "builtin", "multipleLine", {
    helpText: "Optional long text (max 2000 characters)",
  });

  // no columns control: grid layout is determined by design and items

  grid.changeFieldControl("items", "builtin", "entryLinksEditor", {
    helpText:
      "Select entries (cards, testimonials, etc.) to include in the grid",
  });
};
