import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { assertAdmin } from "@/lib/admin-auth";
import { formatZodError, prismaCmsErrorMessage } from "@/lib/cms-api-errors";
import { excerptFromHtml, resolveNewsSlugBase, sanitizeNewsHtml } from "@/lib/news-content";
import { revalidateCmsContent } from "@/lib/cms-revalidate";
import { prisma } from "@/lib/prisma";
import type { NewsItem, Media } from "@prisma/client";

type NewsRow = NewsItem & { media: Media | null };

const emptyToUndef = (v: unknown) => (typeof v === "string" && !v.trim() ? undefined : v);

const createSchema = z.object({
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

async function uniqueNewsSlug(
  tx: Prisma.TransactionClient,
  title: string,
  preferred?: string
): Promise<string> {
  const base = resolveNewsSlugBase(preferred, title).slice(0, 100);
  let slug = base;
  let n = 2;
  for (;;) {
    const clash = await tx.newsItem.findUnique({ where: { slug } });
    if (!clash) return slug;
    slug = `${base}-${n}`;
    n += 1;
  }
}

export async function GET(request: NextRequest) {
  const denied = await assertAdmin(request);
  if (denied) return denied;
  try {
    const rows = await prisma.newsItem.findMany({
      orderBy: [{ sortOrder: "asc" }, { date: "desc" }],
      include: { media: true },
    });
    return NextResponse.json(rows.map(serialize));
  } catch (error) {
    console.error("[cms/news-items GET]", error);
    return NextResponse.json({ error: prismaCmsErrorMessage(error, "load news") }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await assertAdmin(request);
  if (denied) return denied;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const d = parsed.data;

  try {
    const title = d.title?.trim() || "Untitled article";
    const bodyRaw = d.body ?? "";
    const body = bodyRaw.trim() ? sanitizeNewsHtml(bodyRaw) : null;
    const excerpt = d.excerpt?.trim() || excerptFromHtml(body ?? "") || title.slice(0, 220);
    const date = d.date && !Number.isNaN(d.date.getTime()) ? d.date : new Date();

    const row = await prisma.$transaction(async (tx) => {
      const slug = await uniqueNewsSlug(tx, title, d.slug);
      let mediaId: string | null = null;
      if (d.imageUrl) {
        const m = await tx.media.create({
          data: {
            url: d.imageUrl,
            publicId: d.imagePublicId ?? null,
            alt: d.imageAlt ?? null,
          },
        });
        mediaId = m.id;
      }
      return tx.newsItem.create({
        data: {
          slug,
          title,
          excerpt,
          body,
          authorName: d.authorName?.trim() || null,
          authorRole: d.authorRole?.trim() || null,
          date,
          published: d.published ?? false,
          sortOrder: d.sortOrder ?? 0,
          mediaId,
        },
        include: { media: true },
      });
    });

    revalidateCmsContent("news");
    return NextResponse.json(serialize(row));
  } catch (error) {
    console.error("[cms/news-items POST]", error);
    return NextResponse.json({ error: prismaCmsErrorMessage(error, "create article") }, { status: 500 });
  }
}
