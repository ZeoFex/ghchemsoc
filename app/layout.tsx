import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import "goey-toast/styles.css";
import { AppToaster } from "@/components/app-toaster";
import { SiteOfflineNotice } from "@/components/layout/site-offline-notice";
import { AosProvider } from "@/components/providers/aos-provider";
import { getDatabaseOnline } from "@/lib/db-fallback";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

/** ISR fallback: public pages refresh periodically if on-demand revalidation is missed. */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Ghana Chemical Society (GCS)",
  description:
    "The Ghana Chemical Society advances chemistry education, research, innovation, and scientific collaboration in Ghana and beyond.",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
      { url: "/logo/ghana-chemical-society-logo.png", type: "image/png", sizes: "224x224" },
    ],
    shortcut: "/favicon.png",
    apple: "/logo/ghana-chemical-society-logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const databaseOnline = await getDatabaseOnline();

  return (
    <html lang="en">
      <body
        className={`${outfit.variable} font-sans antialiased`}
      >
        {!databaseOnline ? <SiteOfflineNotice /> : null}
        <AosProvider>{children}</AosProvider>
        <AppToaster />
      </body>
    </html>
  );
}
