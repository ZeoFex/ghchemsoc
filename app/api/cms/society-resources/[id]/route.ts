import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { formatZodError, prismaCmsErrorMessage } from "@/lib/cms-api-errors";
import { deleteCloudinaryAsset } from "@/lib/cloudinary-server";
import { revalidateCmsContent } from "@/lib/cms-revalidate";
import { prisma } from "@/lib/prisma";
import { deleteResourceUrlAsset, serializeSocietyResource } from "@/lib/society-resources-cms";

const emptyToUndef = (v: unknown) => (typeof v === "string" && !v.trim() ? undefined : v);

const patchSchema = z
  .object({
    kind: z.enum(["video", "document", "link", "other"]).optional(),
    title: z.string().min(1).max(300).optional(),
    description: z.string().min(1).optional(),
    url: z.preprocess(emptyToUndef, z.string().url().nullable().optional()),
    urlPublicId: z.string().nullable().optional(),
    clearUrl: z.boolean().optional(),
    published: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
    publishedAt: z.coerce.date().nullable().optional(),
    imageUrl: z.preprocess(emptyToUndef, z.string().url().optional()),
    imagePublicId: z.string().nullable().optional(),
    imageAlt: z.preprocess(emptyToUndef, z.string().optional()),
    clearImage: z.boolean().optional(),
  })
  .strict();

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
    const existing = await prisma.societyResource.findUnique({
      where: { id },
      include: { media: true },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const row = await prisma.$transaction(async (tx) => {
      if (d.clearUrl) {
        await deleteResourceUrlAsset(existing.kind, existing.urlPublicId, existing.url);
        await tx.societyResource.update({
          where: { id },
          data: { url: null, urlPublicId: null },
        });
      } else if (d.url !== undefined || d.urlPublicId !== undefined) {
        const nextUrl = d.url !== undefined ? (d.url?.trim() ? d.url.trim() : null) : existing.url;
        const nextPublicId =
          d.urlPublicId !== undefined ? d.urlPublicId : existing.urlPublicId;
        if (existing.urlPublicId && nextPublicId !== existing.urlPublicId) {
          await deleteResourceUrlAsset(existing.kind, existing.urlPublicId, existing.url);
        }
        await tx.societyResource.update({
          where: { id },
          data: {
            ...(d.url !== undefined ? { url: nextUrl } : {}),
            ...(d.urlPublicId !== undefined ? { urlPublicId: nextPublicId } : {}),
          },
        });
      }

      if (d.clearImage && existing.mediaId) {
        const publicId = existing.media?.publicId;
        if (publicId) {
          try {
            await deleteCloudinaryAsset(publicId);
          } catch {
            /* ignore */
          }
        }
        await tx.media.delete({ where: { id: existing.mediaId } });
        await tx.societyResource.update({ where: { id }, data: { mediaId: null } });
      } else if (d.imageUrl !== undefined || d.imagePublicId !== undefined || d.imageAlt !== undefined) {
        if (existing.mediaId) {
          await tx.media.update({
            where: { id: existing.mediaId },
            data: {
              ...(d.imageUrl !== undefined ? { url: d.imageUrl } : {}),
              ...(d.imagePublicId !== undefined ? { publicId: d.imagePublicId } : {}),
              ...(d.imageAlt !== undefined ? { alt: d.imageAlt } : {}),
            },
          });
        } else if (d.imageUrl) {
          const m = await tx.media.create({
            data: {
              url: d.imageUrl,
              publicId: d.imagePublicId ?? null,
              alt: d.imageAlt ?? null,
            },
          });
          await tx.societyResource.update({ where: { id }, data: { mediaId: m.id } });
        }
      }

      return tx.societyResource.update({
        where: { id },
        data: {
          ...(d.kind !== undefined ? { kind: d.kind } : {}),
          ...(d.title !== undefined ? { title: d.title.trim() } : {}),
          ...(d.description !== undefined ? { description: d.description.trim() } : {}),
          ...(d.published !== undefined ? { published: d.published } : {}),
          ...(d.sortOrder !== undefined ? { sortOrder: d.sortOrder } : {}),
          ...(d.publishedAt !== undefined ? { publishedAt: d.publishedAt } : {}),
        },
        include: { media: true },
      });
    });

    revalidateCmsContent("resources");
    return NextResponse.json(serializeSocietyResource(row));
  } catch (error) {
    console.error("[cms/society-resources PATCH]", error);
    return NextResponse.json({ error: prismaCmsErrorMessage(error, "save resource") }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;

  try {
    const existing = await prisma.societyResource.findUnique({
      where: { id },
      include: { media: true },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await deleteResourceUrlAsset(existing.kind, existing.urlPublicId, existing.url);
    const publicId = existing.media?.publicId;
    if (publicId) {
      try {
        await deleteCloudinaryAsset(publicId);
      } catch {
        /* ignore */
      }
    }
    const mediaId = existing.mediaId;
    await prisma.societyResource.delete({ where: { id } });
    if (mediaId) {
      try {
        await prisma.media.delete({ where: { id: mediaId } });
      } catch {
        /* ignore */
      }
    }
    revalidateCmsContent("resources");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[cms/society-resources DELETE]", error);
    return NextResponse.json({ error: prismaCmsErrorMessage(error, "delete resource") }, { status: 500 });
  }
}
