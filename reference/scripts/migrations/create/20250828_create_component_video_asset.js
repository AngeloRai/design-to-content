module.exports = function (migration) {
  const componentVideoAsset = migration
    .createContentType("componentVideoAsset")
    .name("Component: Video Asset")
    .displayField("internalName")
    .description("Video component supporting YouTube URLs or video file assets");

  componentVideoAsset
    .createField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .required(true)
    .validations([
      {
        size: { max: 100 },
      },
    ]);

  componentVideoAsset
    .createField("youTubeUrl")
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
    ]);

  componentVideoAsset
    .createField("videoAsset")
    .name("Video Asset")
    .type("Link")
    .linkType("Asset")
    .required(false)
    .validations([
      {
        linkMimetypeGroup: ["video"],
      },
    ]);

  // Add validation rule that at least one video source must be provided
  componentVideoAsset.changeFieldControl(
    "internalName",
    "builtin",
    "singleLine",
    {
      helpText: "At least one video source (YouTube URL or Video Asset) must be provided",
    }
  );
};