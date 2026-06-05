import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { revalidateCmsContent } from "@/lib/cms-revalidate";
import { prisma } from "@/lib/prisma";
import { registrationFormFieldsSchema } from "@/lib/event-registration-form";
import { isNewsBodyEmpty, sanitizeNewsHtml } from "@/lib/news-content";
import { Prisma } from "@prisma/client";
import type { SocietyEvent, Media } from "@prisma/client";

type Row = SocietyEvent & { media: Media | null };

const createSchema = z.object({
  title: z.string().min(1),
  excerpt: z.string().min(1),
  body: z.string().nullable().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  timeLabel: z.string().min(1),
  location: z.string().min(1),
  href: z.string().nullable().optional(),
  badge: z.string().nullable().optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  sortOrder: z.number().optional(),
  imageUrl: z.string().url(),
  imagePublicId: z.string().nullable().optional(),
  imageAlt: z.string().optional(),
  registrationFormFields: z.union([z.null(), registrationFormFieldsSchema]).optional(),
});

function serialize(r: Row) {
  return {
    id: r.id,
    title: r.title,
    excerpt: r.excerpt,
    body: r.body,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate?.toISOString() ?? null,
    timeLabel: r.timeLabel,
    location: r.location,
    href: r.href,
    badge: r.badge,
    featured: r.featured,
    published: r.published,
    sortOrder: r.sortOrder,
    mediaId: r.mediaId,
    imageUrl: r.media?.url ?? "",
    imagePublicId: r.media?.publicId ?? null,
    imageAlt: r.media?.alt ?? "",
    registrationFormFields: r.registrationFormFields,
  };
}

export async function GET(request: NextRequest) {
  const denied = await assertAdmin(request);
  if (denied) return denied;
  const rows = await prisma.societyEvent.findMany({
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { startDate: "asc" }],
    include: { media: true },
  });
  return NextResponse.json(rows.map(serialize));
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
    const m = await tx.media.create({
      data: {
        url: d.imageUrl,
        publicId: d.imagePublicId ?? null,
        alt: d.imageAlt ?? null,
      },
    });
    return tx.societyEvent.create({
      data: {
        title: d.title,
        excerpt: d.excerpt,
        body:
          d.body != null && !isNewsBodyEmpty(d.body)
            ? sanitizeNewsHtml(d.body)
            : null,
        startDate: d.startDate,
        endDate: d.endDate ?? null,
        timeLabel: d.timeLabel,
        location: d.location,
        href: d.href ?? null,
        badge: d.badge ?? null,
        featured: d.featured ?? false,
        published: d.published ?? true,
        sortOrder: d.sortOrder ?? 0,
        mediaId: m.id,
        ...(d.registrationFormFields !== undefined && d.registrationFormFields !== null
          ? { registrationFormFields: d.registrationFormFields as Prisma.InputJsonValue }
          : {}),
      },
      include: { media: true },
    });
  });

  revalidateCmsContent("events");
  return NextResponse.json(serialize(row as Row));
}
