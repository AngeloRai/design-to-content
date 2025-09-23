/*
  Contentful Migration: Update Component Video Asset content type
  ID: componentVideoAsset
*/

module.exports = function (migration) {
  const componentVideoAsset = migration
    .editContentType("componentVideoAsset")
    .name("Component: Video Asset")
    .displayField("internalName")
    .description("Video component supporting YouTube URLs or video file assets");

  componentVideoAsset
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

  componentVideoAsset
    .editField("youTubeUrl")
    .name("YouTube URL")
    .type("Symbol")
    .required(false)
    .validations([
      {
        regexp: {
          pattern: "^(https?:\\/\\/)?(www\\.)?(youtube\\.com|youtu\\.be)\\/.+$",
          flags: null,
        },
        message: "Must be a valid YouTube URL",
      },
    ])
    .disabled(false)
    .omitted(false);

  componentVideoAsset
    .editField("videoAsset")
    .name("Video Asset")
    .type("Link")
    .linkType("Asset")
    .required(false)
    .validations([
      {
        linkMimetypeGroup: ["video"],
      },
    ])
    .disabled(false)
    .omitted(false);

  // Configure field controls
  componentVideoAsset.changeFieldControl("internalName", "builtin", "singleLine", {
    helpText: "Used internally to identify this video component"
  });

  componentVideoAsset.changeFieldControl("youTubeUrl", "builtin", "singleLine", {
    helpText: "Optional YouTube video URL (e.g., https://youtube.com/watch?v=...)"
  });

  componentVideoAsset.changeFieldControl("videoAsset", "builtin", "assetLinkEditor", {
    helpText: "Optional video file upload (at least one video source must be provided)"
  });
};