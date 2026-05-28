import { prisma } from "@/lib/prisma";
import { withDbFallback } from "@/lib/db-fallback";
import {
  HOMEPAGE_EXPLORE_ID,
  homepageExploreCreateData,
  homepageExploreDefaults,
  mapHomepageExploreRow,
  type HomepageExplorePublic,
} from "@/lib/homepage-explore";
import {
  HOMEPAGE_EVENTS_ID,
  homepageEventsCreateData,
  homepageEventsDefaults,
  mapHomepageEventsRow,
  type HomepageEventsPublic,
  type HomepageEventsRow,
} from "@/lib/homepage-events";
import { HOMEPAGE_EVENTS_DEFAULTS } from "@/lib/homepage-events-defaults";
import {
  HOMEPAGE_PARTNERSHIPS_ID,
  buildHomepagePartnershipsPublic,
  homepagePartnershipsDefaults,
  homepagePartnershipsSettingsCreateData,
  type HomepagePartnershipsPublic,
} from "@/lib/homepage-partnerships";
import {
  SITE_FOOTER_ID,
  mapSiteFooterRow,
  siteFooterCreateData,
  siteFooterDefaults,
  type SiteFooterPublic,
} from "@/lib/site-footer";
import { aboutSectionsPublicFallback } from "@/lib/about-section-defaults";
import { fetchPublishedAboutSections } from "@/lib/about-sections";
import { executivesPublicFallback } from "@/lib/executive-defaults";
import { fetchPublishedExecutives, mapExecutivePublic } from "@/lib/executives";
import { testimonialsPublicFallback } from "@/lib/testimonial-defaults";
import { fetchPublishedTestimonials, mapTestimonialPublic } from "@/lib/testimonials";
import {
  RESOURCES_PAGE_DEFAULTS,
  RESOURCES_PAGE_ID,
  type ResourcesPagePublic,
  type SocietyResourcePublic,
} from "@/lib/resources-page";

export type { HomepageExplorePublic, HomepageEventsPublic, HomepagePartnershipsPublic };

export async function getPublishedAboutSections() {
  return withDbFallback(
    "getPublishedAboutSections",
    () => fetchPublishedAboutSections(),
    aboutSectionsPublicFallback()
  );
}

export async function getPublishedExecutives() {
  return withDbFallback(
    "getPublishedExecutives",
    async () => (await fetchPublishedExecutives()).map(mapExecutivePublic),
    executivesPublicFallback()
  );
}

export async function getPublishedTestimonials() {
  return withDbFallback(
    "getPublishedTestimonials",
    async () => (await fetchPublishedTestimonials()).map(mapTestimonialPublic),
    testimonialsPublicFallback()
  );
}

export async function getPublishedExecutiveById(id: string) {
  return withDbFallback(
    "getPublishedExecutiveById",
    async () => {
      const row = await prisma.executive.findFirst({
        where: { id, published: true },
        include: { media: true },
      });
      if (!row) return null;
      return mapExecutivePublic(row);
    },
    (() => {
      const fallback = executivesPublicFallback();
      return fallback.find((e) => e.id === id) ?? null;
    })()
  );
}

export async function getJoinPageForPublic() {
  return withDbFallback(
    "getJoinPageForPublic",
    async () => {
      const header = await prisma.joinPageHeader.findUnique({
        where: { key: "join_page_header" },
        include: { media: true },
      });
      const steps = await prisma.joinStep.findMany({
        where: { published: true },
        orderBy: { sortOrder: "asc" },
      });
      return { header, steps };
    },
    { header: null, steps: [] }
  );
}

export async function getPublishedNewsItems() {
  return withDbFallback(
    "getPublishedNewsItems",
    () =>
      prisma.newsItem.findMany({
        where: { published: true },
        orderBy: [{ sortOrder: "asc" }, { date: "desc" }],
        include: { media: true },
      }),
    []
  );
}

const publicationInclude = {
  media: true,
  articles: { where: { published: true }, orderBy: { sortOrder: "asc" as const } },
} as const;

export async function getPublishedPublications() {
  return withDbFallback(
    "getPublishedPublications",
    () =>
      prisma.publication.findMany({
        where: { published: true },
        orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { sortOrder: "asc" }],
        include: publicationInclude,
      }),
    []
  );
}

export async function getPublishedPublicationById(id: string) {
  return withDbFallback(
    "getPublishedPublicationById",
    () =>
      prisma.publication.findFirst({
        where: { id, published: true },
        include: publicationInclude,
      }),
    null
  );
}

export async function getFeaturedPublication() {
  return withDbFallback(
    "getFeaturedPublication",
    async () => {
      const featured = await prisma.publication.findFirst({
        where: { published: true, featured: true },
        orderBy: { publishedAt: "desc" },
        include: publicationInclude,
      });
      if (featured) return featured;
      return prisma.publication.findFirst({
        where: { published: true },
        orderBy: [{ publishedAt: "desc" }, { sortOrder: "asc" }],
        include: publicationInclude,
      });
    },
    null
  );
}

export async function getNewsBySlug(slug: string) {
  return withDbFallback(
    "getNewsBySlug",
    () =>
      prisma.newsItem.findFirst({
        where: { slug, published: true },
        include: { media: true },
      }),
    null
  );
}

export async function getPublishedSocietyEvents() {
  return withDbFallback(
    "getPublishedSocietyEvents",
    () =>
      prisma.societyEvent.findMany({
        where: { published: true },
        orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { startDate: "asc" }],
        include: { media: true },
      }),
    []
  );
}

export async function getPublishedSocietyEventById(id: string) {
  return withDbFallback(
    "getPublishedSocietyEventById",
    () =>
      prisma.societyEvent.findFirst({
        where: { id, published: true },
        include: { media: true },
      }),
    null
  );
}

export async function getContactSettings() {
  return withDbFallback(
    "getContactSettings",
    () => prisma.contactSettings.findUnique({ where: { id: "contact" } }),
    null
  );
}

export async function getSiteFooterForPublic(): Promise<SiteFooterPublic> {
  try {
    return await withDbFallback(
      "getSiteFooterForPublic",
      async () => {
        let row = await prisma.siteFooterSettings.findUnique({
          where: { id: SITE_FOOTER_ID },
          include: { leftImageMedia: true, rightImageMedia: true },
        });
        if (!row) {
          row = await prisma.siteFooterSettings.create({
            data: siteFooterCreateData(),
            include: { leftImageMedia: true, rightImageMedia: true },
          });
        }
        return mapSiteFooterRow(row);
      },
      siteFooterDefaults()
    );
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (code === "P2021" || /SiteFooterSettings/i.test(error instanceof Error ? error.message : "")) {
      return siteFooterDefaults();
    }
    throw error;
  }
}

export async function getHomepageExploreForPublic(): Promise<HomepageExplorePublic> {
  return withDbFallback(
    "getHomepageExploreForPublic",
    async () => {
      let row = await prisma.homepageExploreSettings.findUnique({
        where: { id: HOMEPAGE_EXPLORE_ID },
        include: { mainImageMedia: true, secondaryImageMedia: true },
      });
      if (!row) {
        row = await prisma.homepageExploreSettings.create({
          data: homepageExploreCreateData(),
          include: { mainImageMedia: true, secondaryImageMedia: true },
        });
      }
      return mapHomepageExploreRow(row);
    },
    homepageExploreDefaults()
  );
}

export async function ensureHomepageEventsRow(): Promise<HomepageEventsRow> {
  const existing = await prisma.homepageEventsSettings.findUnique({
    where: { id: HOMEPAGE_EVENTS_ID },
    include: { imageMedia: true },
  });
  if (existing?.imageMedia?.url?.trim()) return existing;

  const d = HOMEPAGE_EVENTS_DEFAULTS;
  let imageMediaId = existing?.imageMediaId ?? null;

  if (!imageMediaId) {
    const media = await prisma.media.create({
      data: { url: d.fallbackImageUrl, publicId: null, alt: d.fallbackImageAlt },
    });
    imageMediaId = media.id;
  } else {
    await prisma.media.update({
      where: { id: imageMediaId },
      data: { url: d.fallbackImageUrl, alt: d.fallbackImageAlt },
    });
  }

  if (existing) {
    return prisma.homepageEventsSettings.update({
      where: { id: HOMEPAGE_EVENTS_ID },
      data: { imageMediaId },
      include: { imageMedia: true },
    });
  }

  return prisma.homepageEventsSettings.create({
    data: { ...homepageEventsCreateData(), imageMediaId },
    include: { imageMedia: true },
  });
}

export async function getHomepageEventsForPublic(): Promise<HomepageEventsPublic> {
  return withDbFallback(
    "getHomepageEventsForPublic",
    async () => {
      const row = await ensureHomepageEventsRow();
      return mapHomepageEventsRow(row);
    },
    homepageEventsDefaults()
  );
}

export async function getHomepagePartnershipsForPublic(): Promise<HomepagePartnershipsPublic> {
  return withDbFallback(
    "getHomepagePartnershipsForPublic",
    async () => {
      let settings = await prisma.homepagePartnershipsSettings.findUnique({
        where: { id: HOMEPAGE_PARTNERSHIPS_ID },
      });
      if (!settings) {
        settings = await prisma.homepagePartnershipsSettings.create({
          data: homepagePartnershipsSettingsCreateData(),
        });
      }
      const cards = await prisma.partnershipCard.findMany({
        where: { published: true },
        orderBy: { sortOrder: "asc" },
        include: { media: true },
      });
      return buildHomepagePartnershipsPublic(settings, cards);
    },
    homepagePartnershipsDefaults()
  );
}

export async function getPartnershipCardsForCms() {
  return prisma.partnershipCard.findMany({
    orderBy: { sortOrder: "asc" },
    include: { media: true },
  });
}

export { getMemberPortalForPublic } from "@/lib/member-portal-queries";

function mapSocietyResourcePublic(
  r: {
    id: string;
    kind: SocietyResourcePublic["kind"];
    title: string;
    description: string;
    url: string | null;
    urlPublicId: string | null;
    publishedAt: Date | null;
    media: { url: string; alt: string | null } | null;
  }
): SocietyResourcePublic {
  return {
    id: r.id,
    kind: r.kind,
    title: r.title,
    description: r.description,
    url: r.url,
    urlPublicId: r.urlPublicId ?? null,
    imageUrl: r.media?.url ?? null,
    imageAlt: r.media?.alt ?? null,
    publishedAt: r.publishedAt?.toISOString() ?? null,
  };
}

function isResourcesTableMissing(error: unknown): boolean {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  if (code === "P2021" || code === "P2022") return true;
  const msg = error instanceof Error ? error.message : String(error);
  return /ResourcesPageSettings|SocietyResource|does not exist/i.test(msg);
}

export async function getResourcesPageForPublic(): Promise<ResourcesPagePublic> {
  try {
    return await withDbFallback(
      "getResourcesPageForPublic",
      async () => {
        let row = await prisma.resourcesPageSettings.findUnique({
          where: { id: RESOURCES_PAGE_ID },
        });
        if (!row) {
          row = await prisma.resourcesPageSettings.create({
            data: {
              id: RESOURCES_PAGE_ID,
              eyebrow: RESOURCES_PAGE_DEFAULTS.eyebrow,
              headline: RESOURCES_PAGE_DEFAULTS.headline,
              lead: RESOURCES_PAGE_DEFAULTS.lead,
            },
          });
        }
        return {
          eyebrow: row.eyebrow,
          headline: row.headline,
          lead: row.lead,
        };
      },
      { ...RESOURCES_PAGE_DEFAULTS }
    );
  } catch (error) {
    if (isResourcesTableMissing(error)) return { ...RESOURCES_PAGE_DEFAULTS };
    throw error;
  }
}

export async function getPublishedSocietyResources(): Promise<SocietyResourcePublic[]> {
  try {
    return await withDbFallback(
      "getPublishedSocietyResources",
      async () => {
        const rows = await prisma.societyResource.findMany({
          where: { published: true },
          orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
          include: { media: true },
        });
        return rows.map(mapSocietyResourcePublic);
      },
      []
    );
  } catch (error) {
    if (isResourcesTableMissing(error)) return [];
    throw error;
  }
}
