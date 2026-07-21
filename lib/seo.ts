import type { Metadata } from "next";
import { appBaseUrl } from "@/lib/app-url";
import { SITE_FOOTER_DEFAULTS } from "@/lib/site-footer-defaults";

export const SITE_NAME = "Ghana Chemical Society";
export const SITE_SHORT_NAME = "GCS";
export const SITE_BRAND_SLUG = "ghchemsoc";
export const SITE_LOCALE = "en_GH";

/** Canonical production domain when NEXT_PUBLIC_APP_URL is unset. */
export const PRODUCTION_FALLBACK_URL = "https://www.ghchemsoc.org";

export const DEFAULT_DESCRIPTION =
  "The Ghana Chemical Society (ghchemsoc, GCS) connects professionals across research, industry, and education—advancing chemistry in Ghana through networking, resources, conferences, and shared expertise.";

export const DEFAULT_KEYWORDS = [
  "Ghana Chemical Society",
  "ghchemsoc",
  "GCS",
  "chemistry Ghana",
  "chemical society",
  "chemistry education",
  "chemical research",
  "Ghana chemists",
  "scientific society",
  "chemistry conferences",
  "chemistry publications",
];

export const DEFAULT_OG_IMAGE_PATH = "/logo/ghana-chemical-society-logo.png";

export function getBaseUrl(): string {
  const url = appBaseUrl();
  if (url !== "http://localhost:3000") return url;
  return process.env.NODE_ENV === "production" ? PRODUCTION_FALLBACK_URL : url;
}

export function absoluteUrl(path = ""): string {
  const base = getBaseUrl().replace(/\/$/, "");
  if (!path || path === "/") return `${base}/`;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function absoluteImageUrl(imagePath?: string | null): string {
  const path = imagePath?.trim() || DEFAULT_OG_IMAGE_PATH;
  if (/^https?:\/\//i.test(path)) return path;
  return absoluteUrl(path.startsWith("/") ? path : `/${path}`);
}

export type BuildMetadataOptions = {
  /** Short page title; combined with the root template unless absoluteTitle is set. */
  title: string;
  description?: string;
  /** Site path, e.g. `/about` — used for canonical and Open Graph URL. */
  path?: string;
  image?: string | null;
  imageAlt?: string;
  keywords?: string[];
  noIndex?: boolean;
  type?: "website" | "article";
  publishedTime?: string | Date;
  modifiedTime?: string | Date;
  /** Bypass title template (e.g. long article titles). */
  absoluteTitle?: boolean;
};

function toIsoString(value?: string | Date): string | undefined {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export function buildMetadata(options: BuildMetadataOptions): Metadata {
  const description = (options.description?.trim() || DEFAULT_DESCRIPTION).slice(0, 320);
  const canonical = options.path ? absoluteUrl(options.path) : undefined;
  const imageUrl = absoluteImageUrl(options.image);
  const imageAlt = options.imageAlt?.trim() || SITE_NAME;
  const publishedTime = toIsoString(options.publishedTime);
  const modifiedTime = toIsoString(options.modifiedTime);

  const title = options.absoluteTitle
    ? { absolute: options.title }
    : options.title;

  const openGraphType = options.type === "article" ? "article" : "website";

  return {
    title,
    description,
    keywords: options.keywords ?? DEFAULT_KEYWORDS,
    alternates: canonical ? { canonical } : undefined,
    robots: options.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
    openGraph: {
      type: openGraphType,
      locale: SITE_LOCALE,
      url: canonical,
      siteName: SITE_NAME,
      title: options.absoluteTitle ? options.title : `${SITE_NAME} | ${options.title}`,
      description,
      images: [{ url: imageUrl, alt: imageAlt, width: 1200, height: 630 }],
      ...(openGraphType === "article" && publishedTime
        ? { publishedTime, ...(modifiedTime ? { modifiedTime } : {}) }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: options.absoluteTitle ? options.title : `${SITE_NAME} | ${options.title}`,
      description,
      images: [imageUrl],
    },
  };
}

export type BreadcrumbItem = { name: string; path?: string };

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path ? { item: absoluteUrl(item.path) } : {}),
    })),
  };
}

export function organizationJsonLd(options?: {
  sameAs?: string[];
  email?: string;
  telephone?: string;
}) {
  const sameAs = (options?.sameAs ?? [])
    .map((url) => url.trim())
    .filter((url) => /^https?:\/\//i.test(url));

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    alternateName: [SITE_SHORT_NAME, SITE_BRAND_SLUG],
    url: absoluteUrl("/"),
    logo: absoluteImageUrl(DEFAULT_OG_IMAGE_PATH),
    description: DEFAULT_DESCRIPTION,
    ...(sameAs.length ? { sameAs } : {}),
    ...(options?.email || options?.telephone
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            ...(options.email ? { email: options.email } : {}),
            ...(options.telephone ? { telephone: options.telephone } : {}),
            areaServed: "GH",
            availableLanguage: ["en"],
          },
        }
      : {}),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: [SITE_SHORT_NAME, SITE_BRAND_SLUG],
    url: absoluteUrl("/"),
    description: DEFAULT_DESCRIPTION,
    inLanguage: "en-GH",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: absoluteImageUrl(DEFAULT_OG_IMAGE_PATH),
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function articleJsonLd(options: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  datePublished: string | Date;
  dateModified?: string | Date;
  authorName?: string | null;
}) {
  const published = toIsoString(options.datePublished);
  const modified = toIsoString(options.dateModified ?? options.datePublished);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: options.title,
    description: options.description,
    image: [absoluteImageUrl(options.image)],
    datePublished: published,
    dateModified: modified,
    mainEntityOfPage: absoluteUrl(options.path),
    author: options.authorName?.trim()
      ? { "@type": "Person", name: options.authorName.trim() }
      : { "@type": "Organization", name: SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: absoluteImageUrl(DEFAULT_OG_IMAGE_PATH),
      },
    },
  };
}

export function eventJsonLd(options: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  startDate: string | Date;
  endDate?: string | Date | null;
  location: string;
}) {
  const startDate = toIsoString(options.startDate);
  const endDate = toIsoString(options.endDate ?? undefined);

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: options.title,
    description: options.description,
    image: [absoluteImageUrl(options.image)],
    startDate,
    ...(endDate ? { endDate } : {}),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: options.location,
      address: {
        "@type": "PostalAddress",
        addressLocality: options.location,
        addressCountry: "GH",
      },
    },
    organizer: {
      "@type": "Organization",
      name: SITE_NAME,
      url: absoluteUrl("/"),
    },
    url: absoluteUrl(options.path),
  };
}

export function personJsonLd(options: {
  name: string;
  role: string;
  path: string;
  image?: string | null;
  bio?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: options.name,
    jobTitle: options.role,
    description: options.bio?.trim() || undefined,
    image: options.image ? absoluteImageUrl(options.image) : undefined,
    url: absoluteUrl(options.path),
    worksFor: {
      "@type": "Organization",
      name: SITE_NAME,
      url: absoluteUrl("/"),
    },
  };
}

export function extractContactEmail(cards: unknown): string | undefined {
  if (!Array.isArray(cards)) return SITE_FOOTER_DEFAULTS.helplineText.includes("@")
    ? "secretariat@ghanachemicalsociety.org"
    : undefined;

  for (const item of cards) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const value = typeof o.value === "string" ? o.value.trim() : "";
    if (value.includes("@")) return value;
  }
  return "secretariat@ghanachemicalsociety.org";
}

export function extractContactPhone(cards: unknown): string | undefined {
  if (!Array.isArray(cards)) return undefined;
  for (const item of cards) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (o.icon !== "phone") continue;
    const value = typeof o.value === "string" ? o.value.trim() : "";
    if (value) return value;
  }
  return undefined;
}
