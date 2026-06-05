import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { revalidateCmsContent } from "@/lib/cms-revalidate";
import { prisma } from "@/lib/prisma";
import { deleteCloudinaryAsset } from "@/lib/cloudinary-server";
import { syncPublicationArticles } from "@/lib/publications-sync-articles";
import { serializePublicationCms, type PublicationWithRelations } from "@/lib/publications-serialize";
import type { PublicationArticleInput } from "@/lib/publication-format";

const articleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  authors: z.string().min(1),
  pdfHref: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
  published: z.boolean().optional(),
});

const patchSchema = z
  .object({
    title: z.string().min(1).optional(),
    journalTitle: z.string().nullable().optional(),
    description: z.string().min(1).optional(),
    meta: z.string().nullable().optional(),
    issue: z.string().nullable().optional(),
    href: z.string().nullable().optional(),
    published: z.boolean().optional(),
    featured: z.boolean().optional(),
    publishedAt: z.string().nullable().optional(),
    sortOrder: z.number().optional(),
    imageUrl: z.string().url().optional(),
    imagePublicId: z.string().nullable().optional(),
    imageAlt: z.string().optional(),
    articles: z.array(articleSchema).optional(),
    readerEmails: z.array(z.string().email()).optional(),
    authorEmails: z.array(z.string().email()).optional(),
  })
  .strict();

function parsePublishedAt(value: string | null | undefined) {
  if (value === null) return null;
  if (value === undefined) return undefined;
  if (!value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const existing = await prisma.publication.findUnique({
    where: { id },
    include: { media: true, articles: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const row = await prisma.$transaction(async (tx) => {
    if (d.featured) {
      await tx.publication.updateMany({
        data: { featured: false },
        where: { featured: true, id: { not: id } },
      });
    }

    if (d.imageUrl !== undefined || d.imagePublicId !== undefined || d.imageAlt !== undefined) {
      if (existing.mediaId) {
        await tx.media.update({
          where: { id: existing.mediaId },
          data: {
            ...(d.imageUrl !== undefined ? { url: d.imageUrl } : {}),
            ...(d.imagePublicId !== undefined ? { publicId: d.imagePublicId } : {}),
            ...(d.imageAlt !== undefined ? { alt: d.imageAlt } : {}),
          },
        });
      } else if (d.imageUrl !== undefined) {
        const m = await tx.media.create({
          data: {
            url: d.imageUrl,
            publicId: d.imagePublicId ?? null,
            alt: d.imageAlt ?? null,
          },
        });
        await tx.publication.update({ where: { id }, data: { mediaId: m.id } });
      }
    }

    const publishedAt = parsePublishedAt(d.publishedAt);

    await tx.publication.update({
      where: { id },
      data: {
        ...(d.title !== undefined ? { title: d.title } : {}),
        ...(d.journalTitle !== undefined ? { journalTitle: d.journalTitle?.trim() || null } : {}),
        ...(d.description !== undefined ? { description: d.description } : {}),
        ...(d.meta !== undefined ? { meta: d.meta?.trim() || null } : {}),
        ...(d.issue !== undefined ? { issue: d.issue?.trim() || null } : {}),
        ...(d.href !== undefined ? { href: d.href?.trim() || null } : {}),
        ...(d.published !== undefined ? { published: d.published } : {}),
        ...(d.featured !== undefined ? { featured: d.featured } : {}),
        ...(publishedAt !== undefined ? { publishedAt } : {}),
        ...(d.sortOrder !== undefined ? { sortOrder: d.sortOrder } : {}),
        ...(d.readerEmails !== undefined ? { readerEmails: d.readerEmails } : {}),
        ...(d.authorEmails !== undefined ? { authorEmails: d.authorEmails } : {}),
      },
    });

    if (d.articles !== undefined) {
      await syncPublicationArticles(tx, id, d.articles as PublicationArticleInput[]);
    }

    return tx.publication.findUniqueOrThrow({
      where: { id },
      include: { media: true, articles: { orderBy: { sortOrder: "asc" } } },
    });
  });

  revalidateCmsContent("publications");
  return NextResponse.json(serializePublicationCms(row as PublicationWithRelations));
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  const existing = await prisma.publication.findUnique({
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
  await prisma.publication.delete({ where: { id } });
  if (mediaId) {
    try {
      await prisma.media.delete({ where: { id: mediaId } });
    } catch {
      /* ignore */
    }
  }
  revalidateCmsContent("publications");
  return NextResponse.json({ ok: true });
}
