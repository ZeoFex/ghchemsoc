import type { MetadataRoute } from "next";
import { DEFAULT_DESCRIPTION, SITE_BRAND_SLUG, SITE_NAME, SITE_SHORT_NAME, absoluteUrl } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} (${SITE_BRAND_SLUG})`,
    short_name: SITE_BRAND_SLUG,
    description: DEFAULT_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1d4ed8",
    lang: "en-GH",
    icons: [
      {
        src: "/favicon.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/logo/ghana-chemical-society-logo.png",
        sizes: "224x224",
        type: "image/png",
      },
    ],
    id: absoluteUrl("/"),
  };
}
