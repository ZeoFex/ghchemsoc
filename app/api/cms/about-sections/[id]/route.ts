import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { revalidateCmsContent } from "@/lib/cms-revalidate";
import { prisma } from "@/lib/prisma";
import { deleteCloudinaryAsset } from "@/lib/cloudinary-server";
import type { AboutSection, Media } from "@prisma/client";

type AboutRow = AboutSection & { media: Media | null };

const patchSchema = z
  .object({
    sortOrder: z.number().optional(),
    published: z.boolean().optional(),
    title: z.string().optional(),
    subtitle: z.string().nullable().optional(),
    body: z.string().optional(),
    layout: z.string().optional(),
    imageUrl: z.string().url().optional(),
    imagePublicId: z.string().nullable().optional(),
    imageAlt: z.string().optional(),
  })
  .strict();

function serialize(r: AboutRow) {
  return {
    id: r.id,
    sortOrder: r.sortOrder,
    published: r.published,
    mediaId: r.mediaId,
    title: r.title,
    subtitle: r.subtitle,
    body: r.body,
    layout: r.layout,
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

  const existing = await prisma.aboutSection.findUnique({
    where: { id },
    include: { media: true },
  });
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
        await tx.aboutSection.update({ where: { id }, data: { mediaId: m.id } });
      }
    }

    return tx.aboutSection.update({
      where: { id },
      data: {
        ...(d.sortOrder !== undefined ? { sortOrder: d.sortOrder } : {}),
        ...(d.published !== undefined ? { published: d.published } : {}),
        ...(d.title !== undefined ? { title: d.title } : {}),
        ...(d.subtitle !== undefined ? { subtitle: d.subtitle } : {}),
        ...(d.body !== undefined ? { body: d.body } : {}),
        ...(d.layout !== undefined ? { layout: d.layout } : {}),
      },
      include: { media: true },
    });
  });

  return NextResponse.json(serialize(row));
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  const existing = await prisma.aboutSection.findUnique({
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
  await prisma.aboutSection.delete({ where: { id } });
  if (mediaId) {
    try {
      await prisma.media.delete({ where: { id: mediaId } });
    } catch {
      /* ignore */
    }
  }
  revalidateCmsContent("about");
  return NextResponse.json({ ok: true });
}
