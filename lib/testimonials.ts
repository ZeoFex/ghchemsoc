import { prisma } from "@/lib/prisma";
import { TESTIMONIAL_SEED } from "@/lib/testimonial-defaults";
import type { Media, Testimonial } from "@prisma/client";

export type TestimonialWithMedia = Testimonial & { media: Media | null };

export async function seedTestimonialsIfEmpty(): Promise<void> {
  const count = await prisma.testimonial.count();
  if (count > 0) return;

  for (const t of TESTIMONIAL_SEED) {
    let mediaId: string | null = null;
    if (t.imageUrl) {
      const m = await prisma.media.create({
        data: { url: t.imageUrl, publicId: null, alt: t.imageAlt },
      });
      mediaId = m.id;
    }

    await prisma.testimonial.create({
      data: {
        sortOrder: t.sortOrder,
        published: t.published,
        name: t.name,
        role: t.role,
        quote: t.quote,
        mediaId,
      },
    });
  }
}

export async function fetchPublishedTestimonials(): Promise<TestimonialWithMedia[]> {
  let rows = await prisma.testimonial.findMany({
    where: { published: true },
    orderBy: { sortOrder: "asc" },
    include: { media: true },
  });
  if (rows.length === 0) {
    await seedTestimonialsIfEmpty();
    rows = await prisma.testimonial.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
      include: { media: true },
    });
  }
  return rows;
}

export function mapTestimonialPublic(row: TestimonialWithMedia) {
  return {
    id: row.id,
    sortOrder: row.sortOrder,
    published: row.published,
    name: row.name,
    role: row.role,
    quote: row.quote,
    media: row.media ? { url: row.media.url, alt: row.media.alt } : null,
  };
}

