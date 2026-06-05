import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { formatZodError, prismaCmsErrorMessage } from "@/lib/cms-api-errors";
import { excerptFromHtml, resolveNewsSlugBase, sanitizeNewsHtml } from "@/lib/news-content";
import { revalidateCmsContent } from "@/lib/cms-revalidate";
import { prisma } from "@/lib/prisma";
import { deleteCloudinaryAsset } from "@/lib/cloudinary-server";
import type { NewsItem, Media } from "@prisma/client";

type NewsRow = NewsItem & { media: Media | null };

const emptyToUndef = (v: unknown) => (typeof v === "string" && !v.trim() ? undefined : v);

const patchSchema = z.object({
  slug: z.preprocess(emptyToUndef, z.string().max(120).optional()),
  title: z.preprocess(emptyToUndef, z.string().max(300).optional()),
  excerpt: z.preprocess(emptyToUndef, z.string().optional()),
  body: z.string().optional(),
  authorName: z.preprocess(emptyToUndef, z.string().max(120).nullable().optional()),
  authorRole: z.preprocess(emptyToUndef, z.string().max(200).nullable().optional()),
  date: z.coerce.date().optional(),
  published: z.boolean().optional(),
  sortOrder: z.number().optional(),
  imageUrl: z.preprocess(emptyToUndef, z.string().url().optional()),
  imagePublicId: z.string().nullable().optional(),
  imageAlt: z.preprocess(emptyToUndef, z.string().optional()),
});

function serialize(r: NewsRow) {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    body: r.body,
    authorName: r.authorName,
    authorRole: r.authorRole,
    date: r.date.toISOString(),
    published: r.published,
    sortOrder: r.sortOrder,
    mediaId: r.mediaId,
    imageUrl: r.media?.url ?? "",
    imagePublicId: r.media?.publicId ?? null,
    imageAlt: r.media?.alt ?? "",
  };
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
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const d = parsed.data;

  try {
    const existing = await prisma.newsItem.findUnique({
      where: { id },
      include: { media: true },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const nextTitle = d.title?.trim() || existing.title;

    if (d.slug !== undefined) {
      const nextSlug = resolveNewsSlugBase(d.slug, nextTitle);
      if (nextSlug !== existing.slug) {
        const clash = await prisma.newsItem.findUnique({ where: { slug: nextSlug } });
        if (clash && clash.id !== id) {
          return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
        }
      }
    }

    let bodyUpdate: string | null | undefined;
    if (d.body !== undefined) {
      bodyUpdate = d.body.trim() ? sanitizeNewsHtml(d.body) : null;
    }

    let excerptUpdate: string | undefined;
    if (d.excerpt !== undefined) {
      excerptUpdate = d.excerpt.trim() || excerptFromHtml(bodyUpdate ?? existing.body ?? "") || nextTitle.slice(0, 220);
    } else if (bodyUpdate !== undefined) {
      excerptUpdate = excerptFromHtml(bodyUpdate ?? "") || nextTitle.slice(0, 220);
    }

    const row = await prisma.$transaction(async (tx) => {
      if (d.imageUrl !== undefined || d.imagePublicId !== undefined || d.imageAlt !== undefined) {
        if (d.imageUrl) {
          if (existing.mediaId) {
            await tx.media.update({
              where: { id: existing.mediaId },
              data: {
                url: d.imageUrl,
                ...(d.imagePublicId !== undefined ? { publicId: d.imagePublicId } : {}),
                ...(d.imageAlt !== undefined ? { alt: d.imageAlt } : {}),
              },
            });
          } else {
            const m = await tx.media.create({
              data: {
                url: d.imageUrl,
                publicId: d.imagePublicId ?? null,
                alt: d.imageAlt ?? null,
              },
            });
            await tx.newsItem.update({ where: { id }, data: { mediaId: m.id } });
          }
        }
      }

      const slugUpdate =
        d.slug !== undefined ? resolveNewsSlugBase(d.slug, nextTitle) : undefined;

      return tx.newsItem.update({
        where: { id },
        data: {
          ...(slugUpdate !== undefined ? { slug: slugUpdate } : {}),
          ...(d.title !== undefined ? { title: nextTitle } : {}),
          ...(excerptUpdate !== undefined ? { excerpt: excerptUpdate } : {}),
          ...(bodyUpdate !== undefined ? { body: bodyUpdate } : {}),
          ...(d.authorName !== undefined ? { authorName: d.authorName?.trim() || null } : {}),
          ...(d.authorRole !== undefined ? { authorRole: d.authorRole?.trim() || null } : {}),
          ...(d.date !== undefined && !Number.isNaN(d.date.getTime()) ? { date: d.date } : {}),
          ...(d.published !== undefined ? { published: d.published } : {}),
          ...(d.sortOrder !== undefined ? { sortOrder: d.sortOrder } : {}),
        },
        include: { media: true },
      });
    });

    revalidateCmsContent("news");
    return NextResponse.json(serialize(row));
  } catch (error) {
    console.error("[cms/news-items PATCH]", error);
    return NextResponse.json({ error: prismaCmsErrorMessage(error, "update article") }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;

  try {
    const existing = await prisma.newsItem.findUnique({
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
    await prisma.newsItem.delete({ where: { id } });
    if (mediaId) {
      try {
        await prisma.media.delete({ where: { id: mediaId } });
      } catch {
        /* ignore */
      }
    }
    revalidateCmsContent("news");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[cms/news-items DELETE]", error);
    return NextResponse.json({ error: prismaCmsErrorMessage(error, "delete article") }, { status: 500 });
  }
}
