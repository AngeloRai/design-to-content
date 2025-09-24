import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Temporarily disabled custom loader until contentful integration is ready
    // loader: "custom",
    // loaderFile: "./lib/contentful/utils/contentfulImageLoader.js",
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.ctfassets.net",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
