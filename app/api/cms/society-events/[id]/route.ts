import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { revalidateCmsContent } from "@/lib/cms-revalidate";
import { prisma } from "@/lib/prisma";
import { deleteCloudinaryAsset } from "@/lib/cloudinary-server";
import { registrationFormFieldsSchema } from "@/lib/event-registration-form";
import { isNewsBodyEmpty, sanitizeNewsHtml } from "@/lib/news-content";
import { Prisma } from "@prisma/client";
import type { SocietyEvent, Media } from "@prisma/client";

type Row = SocietyEvent & { media: Media | null };

const patchSchema = z
  .object({
    title: z.string().optional(),
    excerpt: z.string().optional(),
    body: z.string().nullable().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().nullable().optional(),
    timeLabel: z.string().optional(),
    location: z.string().optional(),
    href: z.string().nullable().optional(),
    badge: z.string().nullable().optional(),
    featured: z.boolean().optional(),
    published: z.boolean().optional(),
    sortOrder: z.number().optional(),
    imageUrl: z.string().url().optional(),
    imagePublicId: z.string().nullable().optional(),
    imageAlt: z.string().optional(),
    registrationFormFields: z.union([z.null(), registrationFormFieldsSchema]).optional(),
  })
  .strict();

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

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  const row = await prisma.societyEvent.findUnique({ where: { id }, include: { media: true } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(serialize(row));
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

  const existing = await prisma.societyEvent.findUnique({ where: { id }, include: { media: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const row = await prisma.$transaction(async (tx) => {
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
        await tx.societyEvent.update({ where: { id }, data: { mediaId: m.id } });
      }
    }

    return tx.societyEvent.update({
      where: { id },
      data: {
        ...(d.title !== undefined ? { title: d.title } : {}),
        ...(d.excerpt !== undefined ? { excerpt: d.excerpt } : {}),
        ...(d.body !== undefined
          ? { body: d.body != null && !isNewsBodyEmpty(d.body) ? sanitizeNewsHtml(d.body) : null }
          : {}),
        ...(d.startDate !== undefined ? { startDate: d.startDate } : {}),
        ...(d.endDate !== undefined ? { endDate: d.endDate } : {}),
        ...(d.timeLabel !== undefined ? { timeLabel: d.timeLabel } : {}),
        ...(d.location !== undefined ? { location: d.location } : {}),
        ...(d.href !== undefined ? { href: d.href } : {}),
        ...(d.badge !== undefined ? { badge: d.badge } : {}),
        ...(d.featured !== undefined ? { featured: d.featured } : {}),
        ...(d.published !== undefined ? { published: d.published } : {}),
        ...(d.sortOrder !== undefined ? { sortOrder: d.sortOrder } : {}),
        ...(d.registrationFormFields !== undefined
          ? {
              registrationFormFields:
                d.registrationFormFields === null ? Prisma.DbNull : (d.registrationFormFields as Prisma.InputJsonValue),
            }
          : {}),
      },
      include: { media: true },
    });
  });

  revalidateCmsContent("events");
  return NextResponse.json(serialize(row as Row));
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  const existing = await prisma.societyEvent.findUnique({ where: { id }, include: { media: true } });
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
  await prisma.societyEvent.delete({ where: { id } });
  if (mediaId) {
    try {
      await prisma.media.delete({ where: { id: mediaId } });
    } catch {
      /* ignore */
    }
  }
  revalidateCmsContent("events");
  return NextResponse.json({ ok: true });
}
