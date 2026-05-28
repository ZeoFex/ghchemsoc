import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { prismaCmsErrorMessage } from "@/lib/cms-api-errors";
import { deleteCloudinaryAsset } from "@/lib/cloudinary-server";
import { prisma } from "@/lib/prisma";
import type { Media, Testimonial } from "@prisma/client";

type Row = Testimonial & { media: Media | null };

const patchSchema = z
  .object({
    sortOrder: z.number().optional(),
    published: z.boolean().optional(),
    name: z.string().optional(),
    role: z.string().optional(),
    quote: z.string().optional(),
    imageUrl: z.string().url().optional(),
    imagePublicId: z.string().nullable().optional(),
    imageAlt: z.string().optional(),
  })
  .strict();

function serialize(r: Row) {
  return {
    id: r.id,
    sortOrder: r.sortOrder,
    published: r.published,
    name: r.name,
    role: r.role,
    quote: r.quote,
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
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const existing = await prisma.testimonial.findUnique({ where: { id }, include: { media: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
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
              alt: d.imageAlt ?? existing.name,
            },
          });
          await tx.testimonial.update({ where: { id }, data: { mediaId: m.id } });
        }
      }

      return tx.testimonial.update({
        where: { id },
        data: {
          ...(d.sortOrder !== undefined ? { sortOrder: d.sortOrder } : {}),
          ...(d.published !== undefined ? { published: d.published } : {}),
          ...(d.name !== undefined ? { name: d.name } : {}),
          ...(d.role !== undefined ? { role: d.role } : {}),
          ...(d.quote !== undefined ? { quote: d.quote.trim() } : {}),
        },
        include: { media: true },
      });
    });
    return NextResponse.json(serialize(row));
  } catch (error) {
    console.error("[cms/testimonials PATCH]", error);
    return NextResponse.json({ error: prismaCmsErrorMessage(error, "update testimonial") }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  const existing = await prisma.testimonial.findUnique({ where: { id }, include: { media: true } });
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
  await prisma.testimonial.delete({ where: { id } });
  if (mediaId) {
    try {
      await prisma.media.delete({ where: { id: mediaId } });
    } catch {
      /* ignore */
    }
  }
  return NextResponse.json({ ok: true });
}

