import { z } from "zod";

/** Fields shown in CMS; legacy DB columns are defaulted when omitted. */
export const heroSlideInputSchema = z.object({
  sortOrder: z.number().optional(),
  published: z.boolean().optional(),
  imagePublicId: z.string().nullable().optional(),
  imageUrl: z.string().url(),
  imageAlt: z.string().optional(),
  eyebrow: z.string().optional(),
  headlineLine1: z.string().optional(),
  headlineLine2: z.string().optional(),
  description: z.string().min(1),
  tags: z.array(z.string()).optional(),
  highlights: z.array(z.string()).optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
  secondaryLabel: z.string().nullable().optional(),
  secondaryHref: z.string().nullable().optional(),
  statValue: z.string().nullable().optional(),
  statLabel: z.string().nullable().optional(),
});

export type HeroSlideInput = z.infer<typeof heroSlideInputSchema>;

export function heroSlideDbData(d: HeroSlideInput) {
  return {
    sortOrder: d.sortOrder ?? 0,
    published: d.published ?? true,
    imageAlt: d.imageAlt?.trim() ?? "",
    eyebrow: d.eyebrow?.trim() ?? "",
    headlineLine1: d.headlineLine1?.trim() ?? "",
    headlineLine2: d.headlineLine2?.trim() ?? "",
    description: d.description,
    tags: d.tags ?? [],
    highlights: d.highlights ?? [],
    ctaLabel: d.ctaLabel?.trim() ?? "",
    ctaHref: d.ctaHref?.trim() ?? "",
    secondaryLabel: d.secondaryLabel?.trim() ? d.secondaryLabel.trim() : null,
    secondaryHref: d.secondaryHref?.trim() ? d.secondaryHref.trim() : null,
    statValue: d.statValue?.trim() ? d.statValue.trim() : null,
    statLabel: d.statLabel?.trim() ? d.statLabel.trim() : null,
  };
}
