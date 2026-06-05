import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { revalidateCmsContent } from "@/lib/cms-revalidate";
import { prisma } from "@/lib/prisma";
import type { HomepageEventsSettings, Media } from "@prisma/client";
import { HOMEPAGE_EVENTS_ID } from "@/lib/homepage-events";
import { ensureHomepageEventsRow } from "@/lib/cms-queries";

type Row = HomepageEventsSettings & {
  imageMedia: Media | null;
};

function serialize(r: Row) {
  return {
    id: r.id,
    spotlightEnabled: r.spotlightEnabled,
    sectionEyebrow: r.sectionEyebrow,
    sectionTitle: r.sectionTitle,
    spotlightEyebrow: r.spotlightEyebrow,
    headline: r.headline,
    body: r.body,
    metaLine: r.metaLine ?? "",
    imagePosition: r.imagePosition,
    ctaLabel: r.ctaLabel,
    ctaHref: r.ctaHref,
    imageBadge: r.imageBadge ?? "",
    imageMediaId: r.imageMediaId,
    imageUrl: r.imageMedia?.url ?? "",
    imagePublicId: r.imageMedia?.publicId ?? null,
    imageAlt: r.imageMedia?.alt ?? "",
  };
}

const patchSchema = z
  .object({
    spotlightEnabled: z.boolean().optional(),
    sectionEyebrow: z.string().min(1).optional(),
    sectionTitle: z.string().min(1).optional(),
    spotlightEyebrow: z.string().min(1).optional(),
    headline: z.string().min(1).optional(),
    body: z.string().min(1).optional(),
    metaLine: z.string().optional(),
    imagePosition: z.enum(["left", "right"]).optional(),
    ctaLabel: z.string().min(1).optional(),
    ctaHref: z.string().min(1).optional(),
    imageBadge: z.string().optional(),
    imageUrl: z.string().url().optional(),
    imagePublicId: z.string().nullable().optional(),
    imageAlt: z.string().optional(),
  })
  .strict();

async function ensureRow(): Promise<Row> {
  return ensureHomepageEventsRow();
}

export async function GET(request: NextRequest) {
  const denied = await assertAdmin(request);
  if (denied) return denied;
  const row = await ensureRow();
  return NextResponse.json(serialize(row));
}

export async function PATCH(request: NextRequest) {
  const denied = await assertAdmin(request);
  if (denied) return denied;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const existing = await ensureHomepageEventsRow();

  const row = await prisma.$transaction(async (tx) => {
    let imageMediaId = existing!.imageMediaId;

    const touchImage =
      d.imageUrl !== undefined || d.imagePublicId !== undefined || d.imageAlt !== undefined;
    if (touchImage) {
      if (imageMediaId) {
        await tx.media.update({
          where: { id: imageMediaId },
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
        imageMediaId = m.id;
      }
    }

    return tx.homepageEventsSettings.update({
      where: { id: HOMEPAGE_EVENTS_ID },
      data: {
        ...(d.spotlightEnabled !== undefined ? { spotlightEnabled: d.spotlightEnabled } : {}),
        ...(d.sectionEyebrow !== undefined ? { sectionEyebrow: d.sectionEyebrow } : {}),
        ...(d.sectionTitle !== undefined ? { sectionTitle: d.sectionTitle } : {}),
        ...(d.spotlightEyebrow !== undefined ? { spotlightEyebrow: d.spotlightEyebrow } : {}),
        ...(d.headline !== undefined ? { headline: d.headline } : {}),
        ...(d.body !== undefined ? { body: d.body } : {}),
        ...(d.metaLine !== undefined ? { metaLine: d.metaLine.trim() ? d.metaLine.trim() : null } : {}),
        ...(d.imagePosition !== undefined ? { imagePosition: d.imagePosition } : {}),
        ...(d.ctaLabel !== undefined ? { ctaLabel: d.ctaLabel } : {}),
        ...(d.ctaHref !== undefined ? { ctaHref: d.ctaHref } : {}),
        ...(d.imageBadge !== undefined ? { imageBadge: d.imageBadge.trim() ? d.imageBadge.trim() : null } : {}),
        ...(touchImage && imageMediaId ? { imageMediaId } : {}),
      },
      include: { imageMedia: true },
    });
  });

  revalidateCmsContent("home");
  return NextResponse.json(serialize(row));
}
