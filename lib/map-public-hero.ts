import type { PublicHeroSlide } from "@/lib/fetch-public-hero";
import type { HeroCarouselSlide } from "@/lib/hero-carousel-data";
import { normalizeHeadlineSpacing } from "@/lib/headline-spacing";

function inferVariant(imageUrl: string): "logo" | "photo" {
  if (imageUrl.startsWith("/")) return "logo";
  try {
    const path = new URL(imageUrl).pathname;
    if (path.includes("/logo/") || path.includes("ghana-chemical-society-logo")) return "logo";
  } catch {
    /* relative or invalid */
  }
  return "photo";
}

export function mapPublicHeroToCarousel(slides: PublicHeroSlide[]): HeroCarouselSlide[] {
  return slides.map((s) => {
    const rawTitle = s.headline[0]?.trim() || s.eyebrow?.trim() || "";
    const title = normalizeHeadlineSpacing(rawTitle);
    return {
      id: s.id,
      eyebrow: s.eyebrow?.trim() ?? "",
      title,
      description: s.description,
      variant: inferVariant(s.imageUrl),
      imageSrc: s.imageUrl,
      imageAlt: s.imageAlt?.trim() || title || "Hero slide",
      ctaLabel: s.cta.label?.trim() ?? "",
      ctaHref: s.cta.href?.trim() ?? "",
    };
  });
}
