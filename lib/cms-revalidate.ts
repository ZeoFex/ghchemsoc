import { revalidatePath, revalidateTag } from "next/cache";

/** Shared cache tag for CMS-backed public content. */
export const CMS_CACHE_TAG = "cms";

export type CmsRevalidateScope =
  | "home"
  | "about"
  | "executives"
  | "news"
  | "events"
  | "publications"
  | "resources"
  | "membership"
  | "contact"
  | "all";

const SCOPE_PATHS: Record<CmsRevalidateScope, string[]> = {
  home: ["/"],
  about: ["/about", "/"],
  executives: ["/executives", "/about"],
  news: ["/news", "/"],
  events: ["/events", "/"],
  publications: ["/publications", "/"],
  resources: ["/resources"],
  membership: ["/membership"],
  contact: ["/contact"],
  all: [
    "/",
    "/about",
    "/executives",
    "/news",
    "/events",
    "/publications",
    "/resources",
    "/membership",
    "/contact",
  ],
};

/**
 * Invalidate cached public pages after CMS writes.
 * Uses layout revalidation so dynamic segments (e.g. /news/[slug]) refresh too.
 */
export function revalidateCmsContent(scope: CmsRevalidateScope | CmsRevalidateScope[] = "all") {
  const scopes = Array.isArray(scope) ? scope : [scope];
  const paths = new Set<string>();

  for (const s of scopes) {
    for (const path of SCOPE_PATHS[s]) {
      paths.add(path);
    }
  }

  revalidateTag(CMS_CACHE_TAG, { expire: 0 });

  for (const path of paths) {
    revalidatePath(path, "layout");
  }
}
