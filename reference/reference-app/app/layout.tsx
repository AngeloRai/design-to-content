import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/ui/modules/Navbar";
import Footer from "@/ui/modules/Footer";
import { getLayout } from "@/lib/contentful/fetchers/layout";
import { getLocale } from "@/lib/locale";

// Display font for headers and titles
const caliburnBold = localFont({
  src: "../public/fonts/Caliburn-Bold.otf",
  variable: "--font-heading",
  display: "swap",
  weight: "700",
});

// Serif font for testimonials and elegant content
const freightNeo = localFont({
  src: "../public/fonts/FreightNeo Pro-Medium.ttf",
  variable: "--font-accent",
  display: "swap",
  weight: "500",
});

// Sans-serif fonts for UI and body text
const visbyCFBold = localFont({
  src: "../public/fonts/VisbyCF-Bold.otf",
  variable: "--font-body-bold",
  display: "swap",
  weight: "700",
});

const visbyCFMedium = localFont({
  src: "../public/fonts/VisbyCF-Medium.otf",
  variable: "--font-body",
  display: "swap",
  weight: "500",
});

const visbyCFLight = localFont({
  src: "../public/fonts/VisbyCF-Light.otf",
  variable: "--font-body-light",
  display: "swap",
  weight: "300",
});

export const metadata: Metadata = {
  icons: {
    icon: "/favicon/favicon.ico",
    shortcut: "/favicon/favicon-16x16.png",
    apple: "/favicon/apple-touch-icon.png",
    other: [
      {
        rel: "mask-icon",
        url: "/favicon/safari-pinned-tab.svg",
        color: "#5bbad5",
      },
    ],
  },
  manifest: "/favicon/site.webmanifest",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) || ""
  ),
};

const fetchLayoutData = async () => {
  try {
    const locale = await getLocale();
    const layout = await getLayout(locale);
    const { navbar, footer } = layout?.fields || {};
    return {
      navbar: navbar?.fields || {},
      footer: footer?.fields || {},
    };
  } catch (error) {
    console.warn("Failed to fetch layout from Contentful:", error);
    return { navbar: {}, footer: {} };
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Attempt to fetch fresh data, but don't block rendering
  const { navbar: navbarFields, footer: footerFields } =
    await fetchLayoutData();

  return (
    <html lang="en">
      <body
        className={`${caliburnBold.variable} ${freightNeo.variable} ${visbyCFBold.variable} ${visbyCFMedium.variable} ${visbyCFLight.variable} antialiased`}
      >
        <Navbar {...navbarFields} />
        <main>{children}</main>
        <Footer {...footerFields} />
      </body>
    </html>
  );
}
