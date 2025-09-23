import {
  documentToReactComponents,
  Options,
} from "@contentful/rich-text-react-renderer";
import {
  BLOCKS,
  INLINES,
  MARKS,
  Document,
  Block,
} from "@contentful/rich-text-types";
import Link from "next/link";
import Image from "next/image";
import { toAbsoluteCtfUrl } from "@/lib/contentful/utils/image";
import { Video } from "./Video";
import { isTypeComponentVideoAsset } from "@/lib/contentful/types/generated/TypeComponentVideoAsset";
import { VideoAssetProps } from "@/lib/contentful/types/fields";

interface RichTextProps {
  content: Document;
  className?: string;
}

/**
 * Simplified RichText renderer for Contentful Document type
 * Supports the validation rules: bold, italic, underline marks
 * and various heading levels, lists, blockquote, hyperlinks, and embedded assets
 */
export function RichText({ content, className = "" }: RichTextProps) {
  if (!content) return null;

  const options: Options = {
    renderMark: {
      [MARKS.BOLD]: (text) => <strong className="font-body-bold">{text}</strong>,
      [MARKS.ITALIC]: (text) => <em className="italic">{text}</em>,
      [MARKS.UNDERLINE]: (text) => <span className="underline">{text}</span>,
    },

    renderNode: {
      // Headings with consistent styling from your design system
      [BLOCKS.HEADING_1]: (node, children) => (
        <h1 className="font-heading text-4xl lg:text-5xl xl:text-6xl font-body-bold text-neutral-dark mb-6 mt-8">
          {children}
        </h1>
      ),
      [BLOCKS.HEADING_2]: (node, children) => (
        <h2 className="font-heading text-3xl lg:text-4xl font-body-bold text-neutral-dark mb-4 mt-8">
          {children}
        </h2>
      ),
      [BLOCKS.HEADING_3]: (node, children) => (
        <h3 className="font-heading text-2xl lg:text-3xl font-body-bold text-brand-primary mb-4 mt-6">
          {children}
        </h3>
      ),
      [BLOCKS.HEADING_4]: (node, children) => (
        <h4 className="font-heading text-xl lg:text-2xl font-body-bold text-brand-primary mb-3 mt-6">
          {children}
        </h4>
      ),
      [BLOCKS.HEADING_5]: (node, children) => (
        <h5 className="font-heading text-lg lg:text-xl font-body-bold text-brand-primary mb-3 mt-4">
          {children}
        </h5>
      ),
      [BLOCKS.HEADING_6]: (node, children) => (
        <h6 className="font-heading text-base lg:text-lg font-body-bold text-brand-primary mb-2 mt-4">
          {children}
        </h6>
      ),

      // Paragraph
      [BLOCKS.PARAGRAPH]: (node, children) => {
        // Handle empty paragraphs as line breaks
        const block = node as Block;
        if (
          block.content?.length === 1 &&
          block.content[0].nodeType === "text" &&
          !block.content[0].value
        ) {
          return <br className="my-2" />;
        }

        // Use custom className if provided, otherwise use default styling
        const paragraphClasses = className 
          ? `text-base lg:text-lg mb-4 leading-relaxed ${className}`
          : "text-base lg:text-lg mb-4 leading-relaxed";

        // Add font-body to paragraphs if no custom class is provided
        const finalParagraphClasses = className 
          ? paragraphClasses
          : `text-base lg:text-lg mb-4 leading-relaxed font-body`;

        return (
          <p className={finalParagraphClasses}>
            {children}
          </p>
        );
      },

      // Lists
      [BLOCKS.UL_LIST]: (node, children) => (
        <ul className="list-disc pl-6 mb-4 space-y-2">
          {children}
        </ul>
      ),
      [BLOCKS.OL_LIST]: (node, children) => (
        <ol className="list-decimal pl-6 mb-4 space-y-2">
          {children}
        </ol>
      ),
      [BLOCKS.LIST_ITEM]: (node, children) => (
        <li className="text-base lg:text-lg leading-relaxed font-body">{children}</li>
      ),

      // Blockquote
      [BLOCKS.QUOTE]: (node, children) => (
        <blockquote className="border-l-4 border-brand-primary pl-4 my-6 italic text-lg">
          {children}
        </blockquote>
      ),

      // Horizontal rule
      [BLOCKS.HR]: () => <hr className="border-t border-gray-300 my-8" />,

      // Hyperlinks
      [INLINES.HYPERLINK]: (node, children) => {
        const url = node.data.uri;
        const isExternal = url.startsWith("http");

        if (isExternal) {
          return (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-primary underline hover:text-brand-secondary transition-colors"
            >
              {children}
            </a>
          );
        }

        return (
          <Link
            href={url}
            className="text-brand-primary underline hover:text-brand-secondary transition-colors"
          >
            {children}
          </Link>
        );
      },

      // Embedded assets (images)
      [BLOCKS.EMBEDDED_ASSET]: (node) => {
        const { file, title, description } = node.data.target.fields;

        if (!file?.url) return null;
        const absUrl = toAbsoluteCtfUrl(file.url);
        if (!absUrl) return null;

        // Check if it's an image
        const isImage = file.contentType?.startsWith("image/");

        if (isImage) {
          return (
            <figure className="my-8">
              <Image
                src={absUrl}
                alt={title || description || "Embedded image"}
                width={1200}
                height={800}
                className="w-full h-auto rounded-lg"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              />
              {description && (
                <figcaption className="text-sm text-gray-600 mt-2 text-center italic">
                  {description}
                </figcaption>
              )}
            </figure>
          );
        }

        // Handle other asset types (PDFs, etc.)
        return (
          <a
            href={absUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-brand-primary underline hover:text-brand-secondary my-4"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {title || "Download file"}
          </a>
        );
      },

      // Entry hyperlinks (internal links to other content)
      [INLINES.ENTRY_HYPERLINK]: (node, children) => {
        const slug = node.data.target.fields?.slug;

        if (!slug) return <>{children}</>;

        return (
          <Link
            href={`/${slug}`}
            className="text-brand-primary underline hover:text-brand-secondary transition-colors"
          >
            {children}
          </Link>
        );
      },

      // Embedded entries (Component Video Asset, etc.)
      [BLOCKS.EMBEDDED_ENTRY]: (node) => {
        const entry = node.data.target;

        if (!entry) return null;

        // Handle Component Video Asset
        if (isTypeComponentVideoAsset(entry)) {
          const videoAsset = entry.fields.videoAsset as VideoAssetProps['videoAsset']
          const youTubeUrl = entry.fields.youTubeUrl as VideoAssetProps['youTubeUrl']
          return (
            <div className="my-8">
              <Video
                youTubeUrl={youTubeUrl}
                videoAsset={videoAsset}
                className=""
              />
            </div>
          );
        }

        // Handle direct image assets embedded as entries
        if (entry.sys?.type === "Asset") {
          const asset = entry
          const { file, title, description } = asset.fields || {};

          if (!file?.url) return null;
          const absUrl = toAbsoluteCtfUrl(file.url);
          if (!absUrl) return null;

          // Check if it's an image
          const isImage = file.contentType?.startsWith("image/");

          if (isImage) {
            return (
              <figure className="my-8">
                <Image
                  src={absUrl}
                  alt={title || description || "Embedded image"}
                  width={1200}
                  height={800}
                  className="w-full h-auto rounded-lg"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                />
              </figure>
            );
          }
        }

        return null;
      },
    },

    // Handle line breaks in text
    renderText: (text) => {
      return text.split("\n").map((textPart, i) => (
        <span key={i}>
          {textPart}
          {i < text.split("\n").length - 1 && <br />}
        </span>
      ));
    },
  };

  return (
    <div className={`rich-text prose max-w-none ${className}`}>
      {documentToReactComponents(content, options)}
    </div>
  );
}
