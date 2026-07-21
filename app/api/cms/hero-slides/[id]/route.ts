import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { revalidateCmsContent } from "@/lib/cms-revalidate";
import { prisma } from "@/lib/prisma";
import { deleteCloudinaryAsset } from "@/lib/cloudinary-server";

const patchSchema = z
  .object({
    sortOrder: z.number().optional(),
    published: z.boolean().optional(),
    imagePublicId: z.string().nullable().optional(),
    imageUrl: z.string().url().optional(),
    imageAlt: z.string().optional(),
    eyebrow: z.string().optional(),
    headlineLine1: z.string().optional(),
    headlineLine2: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    highlights: z.array(z.string()).optional(),
    ctaLabel: z.string().optional(),
    ctaHref: z.string().optional(),
    secondaryLabel: z.string().nullable().optional(),
    secondaryHref: z.string().nullable().optional(),
    statValue: z.string().nullable().optional(),
    statLabel: z.string().nullable().optional(),
  })
  .strict();

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  const json = await request.json();
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const slide = await prisma.heroSlide.findUnique({
    where: { id },
    include: { media: true },
  });
  if (!slide) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const row = await prisma.$transaction(async (tx) => {
    if (d.imageUrl !== undefined || d.imagePublicId !== undefined || d.imageAlt !== undefined) {
      if (slide.mediaId) {
        await tx.media.update({
          where: { id: slide.mediaId },
          data: {
            ...(d.imageUrl !== undefined ? { url: d.imageUrl } : {}),
            ...(d.imagePublicId !== undefined ? { publicId: d.imagePublicId } : {}),
            ...(d.imageAlt !== undefined ? { alt: d.imageAlt } : {}),
          },
        });
      } else if (d.imageUrl !== undefined) {
        const media = await tx.media.create({
          data: {
            url: d.imageUrl,
            publicId: d.imagePublicId ?? null,
            alt: d.imageAlt ?? slide.imageAlt,
          },
        });
        await tx.heroSlide.update({
          where: { id },
          data: { mediaId: media.id },
        });
      }
    }

    return tx.heroSlide.update({
      where: { id },
      data: {
        ...(d.sortOrder !== undefined ? { sortOrder: d.sortOrder } : {}),
        ...(d.published !== undefined ? { published: d.published } : {}),
        ...(d.imageAlt !== undefined ? { imageAlt: d.imageAlt.trim() } : {}),
        ...(d.eyebrow !== undefined ? { eyebrow: d.eyebrow.trim() } : {}),
        ...(d.headlineLine1 !== undefined ? { headlineLine1: d.headlineLine1.trim() } : {}),
        ...(d.headlineLine2 !== undefined ? { headlineLine2: d.headlineLine2.trim() } : {}),
        ...(d.description !== undefined ? { description: d.description } : {}),
        ...(d.tags !== undefined ? { tags: d.tags } : {}),
        ...(d.highlights !== undefined ? { highlights: d.highlights } : {}),
        ...(d.ctaLabel !== undefined ? { ctaLabel: d.ctaLabel.trim() } : {}),
        ...(d.ctaHref !== undefined ? { ctaHref: d.ctaHref.trim() } : {}),
        ...(d.secondaryLabel !== undefined ? { secondaryLabel: d.secondaryLabel } : {}),
        ...(d.secondaryHref !== undefined ? { secondaryHref: d.secondaryHref } : {}),
        ...(d.statValue !== undefined ? { statValue: d.statValue } : {}),
        ...(d.statLabel !== undefined ? { statLabel: d.statLabel } : {}),
      },
      include: { media: true },
    });
  });

  const tags = Array.isArray(row.tags) ? row.tags.filter((x): x is string => typeof x === "string") : [];
  const highlights = Array.isArray(row.highlights)
    ? row.highlights.filter((x): x is string => typeof x === "string")
    : [];

  revalidateCmsContent("home");
  return NextResponse.json({
    id: row.id,
    sortOrder: row.sortOrder,
    published: row.published,
    mediaId: row.mediaId,
    imageUrl: row.media?.url ?? "",
    imagePublicId: row.media?.publicId ?? null,
    imageAlt: row.imageAlt,
    eyebrow: row.eyebrow,
    headlineLine1: row.headlineLine1,
    headlineLine2: row.headlineLine2,
    description: row.description,
    tagsJson: JSON.stringify(tags),
    highlightsJson: JSON.stringify(highlights),
    ctaLabel: row.ctaLabel,
    ctaHref: row.ctaHref,
    secondaryLabel: row.secondaryLabel,
    secondaryHref: row.secondaryHref,
    statValue: row.statValue,
    statLabel: row.statLabel,
  });
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  const existing = await prisma.heroSlide.findUnique({
    where: { id },
    include: { media: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const mediaId = existing.mediaId;
  const publicId = existing.media?.publicId;

  if (publicId) {
    try {
      await deleteCloudinaryAsset(publicId);
    } catch {
      /* ignore */
    }
  }

  await prisma.heroSlide.delete({ where: { id } });
  if (mediaId) {
    try {
      await prisma.media.delete({ where: { id: mediaId } });
    } catch {
      /* may be referenced elsewhere */
    }
  }

  revalidateCmsContent("home");
  return NextResponse.json({ ok: true });
}
