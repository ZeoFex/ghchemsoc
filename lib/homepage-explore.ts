import type { HomepageExploreSettings, Media } from "@prisma/client";
import { HOMEPAGE_EXPLORE_DEFAULTS } from "@/lib/homepage-explore-defaults";
import { normalizeHeadlineSpacing } from "@/lib/headline-spacing";

export const HOMEPAGE_EXPLORE_ID = "homepage_explore" as const;

export type HomepageExplorePublic = {
  missionEyebrow: string;
  headlineLine1: string;
  headlineLine2: string;
  aboutEyebrow: string;
  aboutBody: string;
  imageBadge: string;
  imageHoverQuote: string;
  locationLabel: string;
  secondaryBadge: string;
  bottomBlurb: string;
  mainImageUrl: string;
  mainImageAlt: string;
  secondaryImageUrl: string;
  secondaryImageAlt: string;
};

export type HomepageExploreRow = HomepageExploreSettings & {
  mainImageMedia: Media | null;
  secondaryImageMedia: Media | null;
};

export function homepageExploreCreateData() {
  const d = HOMEPAGE_EXPLORE_DEFAULTS;
  return {
    id: HOMEPAGE_EXPLORE_ID,
    missionEyebrow: d.missionEyebrow,
    headlineLine1: d.headlineLine1,
    headlineLine2: d.headlineLine2,
    aboutEyebrow: d.aboutEyebrow,
    aboutBody: d.aboutBody,
    imageBadge: d.imageBadge,
    imageHoverQuote: d.imageHoverQuote,
    locationLabel: d.locationLabel,
    secondaryBadge: d.secondaryBadge,
    bottomBlurb: d.bottomBlurb,
  };
}

export function mapHomepageExploreRow(row: HomepageExploreRow): HomepageExplorePublic {
  const d = HOMEPAGE_EXPLORE_DEFAULTS;
  return {
    missionEyebrow: row.missionEyebrow,
    headlineLine1: normalizeHeadlineSpacing(row.headlineLine1),
    headlineLine2: normalizeHeadlineSpacing(row.headlineLine2),
    aboutEyebrow: row.aboutEyebrow,
    aboutBody: row.aboutBody,
    imageBadge: row.imageBadge,
    imageHoverQuote: row.imageHoverQuote,
    locationLabel: row.locationLabel,
    secondaryBadge: row.secondaryBadge,
    bottomBlurb: row.bottomBlurb,
    mainImageUrl: row.mainImageMedia?.url ?? d.fallbackMainImageUrl,
    mainImageAlt: row.mainImageMedia?.alt ?? d.fallbackMainImageAlt,
    secondaryImageUrl: row.secondaryImageMedia?.url ?? d.fallbackSecondaryImageUrl,
    secondaryImageAlt: row.secondaryImageMedia?.alt ?? d.fallbackSecondaryImageAlt,
  };
}

export function homepageExploreDefaults(): HomepageExplorePublic {
  const d = HOMEPAGE_EXPLORE_DEFAULTS;
  return {
    missionEyebrow: d.missionEyebrow,
    headlineLine1: normalizeHeadlineSpacing(d.headlineLine1),
    headlineLine2: normalizeHeadlineSpacing(d.headlineLine2),
    aboutEyebrow: d.aboutEyebrow,
    aboutBody: d.aboutBody,
    imageBadge: d.imageBadge,
    imageHoverQuote: d.imageHoverQuote,
    locationLabel: d.locationLabel,
    secondaryBadge: d.secondaryBadge,
    bottomBlurb: d.bottomBlurb,
    mainImageUrl: d.fallbackMainImageUrl,
    mainImageAlt: d.fallbackMainImageAlt,
    secondaryImageUrl: d.fallbackSecondaryImageUrl,
    secondaryImageAlt: d.fallbackSecondaryImageAlt,
  };
}
