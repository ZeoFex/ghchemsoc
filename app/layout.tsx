import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import "goey-toast/styles.css";
import { AppToaster } from "@/components/app-toaster";
import { SiteOfflineNotice } from "@/components/layout/site-offline-notice";
import { GlobalJsonLd } from "@/components/seo/global-json-ld";
import { AosProvider } from "@/components/providers/aos-provider";
import { getDatabaseOnline } from "@/lib/db-fallback";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_OG_IMAGE_PATH,
  SITE_BRAND_SLUG,
  SITE_LOCALE,
  SITE_NAME,
  absoluteImageUrl,
  getBaseUrl,
} from "@/lib/seo";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

/** ISR fallback: public pages refresh periodically if on-demand revalidation is missed. */
export const revalidate = 60;

const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: `${SITE_NAME} (${SITE_BRAND_SLUG})`,
    template: `${SITE_NAME} | %s`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: getBaseUrl() }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "science",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: SITE_LOCALE,
    url: "/",
    siteName: SITE_NAME,
    title: `${SITE_NAME} (${SITE_BRAND_SLUG})`,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: absoluteImageUrl(DEFAULT_OG_IMAGE_PATH),
        alt: `${SITE_NAME} logo`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} (${SITE_BRAND_SLUG})`,
    description: DEFAULT_DESCRIPTION,
    images: [absoluteImageUrl(DEFAULT_OG_IMAGE_PATH)],
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
      { url: "/logo/ghana-chemical-society-logo.png", type: "image/png", sizes: "224x224" },
    ],
    shortcut: "/favicon.png",
    apple: "/logo/ghana-chemical-society-logo.png",
  },
  manifest: "/manifest.webmanifest",
  ...(googleSiteVerification
    ? { verification: { google: googleSiteVerification } }
    : {}),
};

export const viewport: Viewport = {
  themeColor: "#1d4ed8",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const databaseOnline = await getDatabaseOnline();

  return (
    <html lang="en-GH">
      <body
        className={`${outfit.variable} font-sans antialiased`}
      >
        <GlobalJsonLd />
        {!databaseOnline ? <SiteOfflineNotice /> : null}
        <AosProvider>{children}</AosProvider>
        <AppToaster />
      </body>
    </html>
  );
}
