import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { revalidateCmsContent } from "@/lib/cms-revalidate";
import { prisma } from "@/lib/prisma";
import { normalizePublicationArticles } from "@/lib/publication-format";
import { syncPublicationArticles } from "@/lib/publications-sync-articles";
import { serializePublicationCms, type PublicationWithRelations } from "@/lib/publications-serialize";

const articleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  authors: z.string().min(1),
  pdfHref: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
  published: z.boolean().optional(),
});

const createSchema = z.object({
  title: z.string().min(1),
  journalTitle: z.string().nullable().optional(),
  description: z.string().min(1),
  meta: z.string().nullable().optional(),
  issue: z.string().nullable().optional(),
  href: z.string().nullable().optional(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  publishedAt: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
  imageUrl: z.string().url(),
  imagePublicId: z.string().nullable().optional(),
  imageAlt: z.string().optional(),
  readerEmails: z.array(z.string().email()).optional(),
  authorEmails: z.array(z.string().email()).optional(),
  articles: z.array(articleSchema).optional(),
});

function parsePublishedAt(value: string | null | undefined) {
  if (!value?.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(request: NextRequest) {
  const denied = await assertAdmin(request);
  if (denied) return denied;
  const rows = await prisma.publication.findMany({
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { sortOrder: "asc" }],
    include: { media: true, articles: { orderBy: { sortOrder: "asc" } } },
  });
  return NextResponse.json(rows.map(serializePublicationCms));
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
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const row = await prisma.$transaction(async (tx) => {
    if (d.featured) {
      await tx.publication.updateMany({ data: { featured: false }, where: { featured: true } });
    }

    const m = await tx.media.create({
      data: {
        url: d.imageUrl,
        publicId: d.imagePublicId ?? null,
        alt: d.imageAlt ?? null,
      },
    });

    const pub = await tx.publication.create({
      data: {
        title: d.title,
        journalTitle: d.journalTitle?.trim() || null,
        description: d.description,
        meta: d.meta?.trim() || null,
        issue: d.issue?.trim() || null,
        href: d.href?.trim() || null,
        published: d.published ?? true,
        featured: d.featured ?? false,
        publishedAt: parsePublishedAt(d.publishedAt ?? null),
        sortOrder: d.sortOrder ?? 0,
        readerEmails: d.readerEmails ?? [],
        authorEmails: d.authorEmails ?? [],
        mediaId: m.id,
      },
      include: { media: true, articles: true },
    });

    const articles = normalizePublicationArticles(d.articles ?? []);
    for (let i = 0; i < articles.length; i++) {
      const a = articles[i];
      await tx.publicationArticle.create({
        data: {
          publicationId: pub.id,
          title: a.title,
          authors: a.authors,
          pdfHref: a.pdfHref,
          sortOrder: a.sortOrder ?? i,
          published: a.published ?? true,
        },
      });
    }

    return tx.publication.findUniqueOrThrow({
      where: { id: pub.id },
      include: { media: true, articles: { orderBy: { sortOrder: "asc" } } },
    });
  });

  revalidateCmsContent("publications");
  return NextResponse.json(serializePublicationCms(row as PublicationWithRelations));
}
