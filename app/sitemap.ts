import type { MetadataRoute } from "next";
import {
  getPublishedExecutives,
  getPublishedNewsItems,
  getPublishedPublications,
  getPublishedSocietyEvents,
} from "@/lib/cms-queries";
import { absoluteUrl, getBaseUrl } from "@/lib/seo";

const STATIC_ROUTES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/about", changeFrequency: "monthly", priority: 0.9 },
  { path: "/news", changeFrequency: "daily", priority: 0.9 },
  { path: "/events", changeFrequency: "weekly", priority: 0.9 },
  { path: "/publications", changeFrequency: "weekly", priority: 0.85 },
  { path: "/resources", changeFrequency: "weekly", priority: 0.85 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.8 },
  { path: "/membership", changeFrequency: "monthly", priority: 0.85 },
  { path: "/executives", changeFrequency: "monthly", priority: 0.75 },
];

async function safeSitemapQuery<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[sitemap] ${label} failed`, error);
    return fallback;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl();
  const [news, events, publications, executives] = await Promise.all([
    safeSitemapQuery("news", getPublishedNewsItems, []),
    safeSitemapQuery("events", getPublishedSocietyEvents, []),
    safeSitemapQuery("publications", getPublishedPublications, []),
    safeSitemapQuery("executives", getPublishedExecutives, []),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const newsEntries: MetadataRoute.Sitemap = news
    .filter((item) => item.slug)
    .map((item) => ({
      url: absoluteUrl(`/news/${item.slug}`),
      lastModified: item.date,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  const eventEntries: MetadataRoute.Sitemap = events.map((event) => ({
    url: absoluteUrl(`/events/${event.id}`),
    lastModified: event.startDate,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const publicationEntries: MetadataRoute.Sitemap = publications.map((issue) => ({
    url: absoluteUrl(`/publications/${issue.id}`),
    lastModified: issue.publishedAt ?? new Date(),
    changeFrequency: "monthly",
    priority: 0.65,
  }));

  const executiveEntries: MetadataRoute.Sitemap = executives.map((exec) => ({
    url: absoluteUrl(`/executives/${exec.id}`),
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.55,
  }));

  // Ensure sitemap base matches configured canonical host.
  void base;

  return [
    ...staticEntries,
    ...newsEntries,
    ...eventEntries,
    ...publicationEntries,
    ...executiveEntries,
  ];
}
