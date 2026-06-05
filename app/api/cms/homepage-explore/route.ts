import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { revalidateCmsContent } from "@/lib/cms-revalidate";
import { prisma } from "@/lib/prisma";
import type { HomepageExploreSettings, Media } from "@prisma/client";
import { HOMEPAGE_EXPLORE_ID, homepageExploreCreateData } from "@/lib/homepage-explore";

type Row = HomepageExploreSettings & {
  mainImageMedia: Media | null;
  secondaryImageMedia: Media | null;
};

function serialize(r: Row) {
  return {
    id: r.id,
    missionEyebrow: r.missionEyebrow,
    headlineLine1: r.headlineLine1,
    headlineLine2: r.headlineLine2,
    aboutEyebrow: r.aboutEyebrow,
    aboutBody: r.aboutBody,
    imageBadge: r.imageBadge,
    imageHoverQuote: r.imageHoverQuote,
    locationLabel: r.locationLabel,
    secondaryBadge: r.secondaryBadge,
    bottomBlurb: r.bottomBlurb,
    mainImageMediaId: r.mainImageMediaId,
    mainImageUrl: r.mainImageMedia?.url ?? "",
    mainImagePublicId: r.mainImageMedia?.publicId ?? null,
    mainImageAlt: r.mainImageMedia?.alt ?? "",
    secondaryImageMediaId: r.secondaryImageMediaId,
    secondaryImageUrl: r.secondaryImageMedia?.url ?? "",
    secondaryImagePublicId: r.secondaryImageMedia?.publicId ?? null,
    secondaryImageAlt: r.secondaryImageMedia?.alt ?? "",
  };
}

const patchSchema = z
  .object({
    missionEyebrow: z.string().min(1).optional(),
    headlineLine1: z.string().min(1).optional(),
    headlineLine2: z.string().min(1).optional(),
    aboutEyebrow: z.string().min(1).optional(),
    aboutBody: z.string().min(1).optional(),
    imageBadge: z.string().min(1).optional(),
    imageHoverQuote: z.string().min(1).optional(),
    locationLabel: z.string().min(1).optional(),
    secondaryBadge: z.string().min(1).optional(),
    bottomBlurb: z.string().min(1).optional(),
    mainImageUrl: z.string().url().optional(),
    mainImagePublicId: z.string().nullable().optional(),
    mainImageAlt: z.string().optional(),
    secondaryImageUrl: z.string().url().optional(),
    secondaryImagePublicId: z.string().nullable().optional(),
    secondaryImageAlt: z.string().optional(),
  })
  .strict();

async function ensureRow(): Promise<Row> {
  let row = await prisma.homepageExploreSettings.findUnique({
    where: { id: HOMEPAGE_EXPLORE_ID },
    include: { mainImageMedia: true, secondaryImageMedia: true },
  });
  if (!row) {
    row = await prisma.homepageExploreSettings.create({
      data: homepageExploreCreateData(),
      include: { mainImageMedia: true, secondaryImageMedia: true },
    });
  }
  return row;
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

  let existing = await prisma.homepageExploreSettings.findUnique({
    where: { id: HOMEPAGE_EXPLORE_ID },
    include: { mainImageMedia: true, secondaryImageMedia: true },
  });
  if (!existing) {
    existing = await prisma.homepageExploreSettings.create({
      data: homepageExploreCreateData(),
      include: { mainImageMedia: true, secondaryImageMedia: true },
    });
  }

  const row = await prisma.$transaction(async (tx) => {
    let mainImageMediaId = existing!.mainImageMediaId;
    let secondaryImageMediaId = existing!.secondaryImageMediaId;

    const touchMain =
      d.mainImageUrl !== undefined || d.mainImagePublicId !== undefined || d.mainImageAlt !== undefined;
    if (touchMain) {
      if (mainImageMediaId) {
        await tx.media.update({
          where: { id: mainImageMediaId },
          data: {
            ...(d.mainImageUrl !== undefined ? { url: d.mainImageUrl } : {}),
            ...(d.mainImagePublicId !== undefined ? { publicId: d.mainImagePublicId } : {}),
            ...(d.mainImageAlt !== undefined ? { alt: d.mainImageAlt } : {}),
          },
        });
      } else if (d.mainImageUrl !== undefined) {
        const m = await tx.media.create({
          data: {
            url: d.mainImageUrl,
            publicId: d.mainImagePublicId ?? null,
            alt: d.mainImageAlt ?? null,
          },
        });
        mainImageMediaId = m.id;
      }
    }

    const touchSecondary =
      d.secondaryImageUrl !== undefined ||
      d.secondaryImagePublicId !== undefined ||
      d.secondaryImageAlt !== undefined;
    if (touchSecondary) {
      if (secondaryImageMediaId) {
        await tx.media.update({
          where: { id: secondaryImageMediaId },
          data: {
            ...(d.secondaryImageUrl !== undefined ? { url: d.secondaryImageUrl } : {}),
            ...(d.secondaryImagePublicId !== undefined ? { publicId: d.secondaryImagePublicId } : {}),
            ...(d.secondaryImageAlt !== undefined ? { alt: d.secondaryImageAlt } : {}),
          },
        });
      } else if (d.secondaryImageUrl !== undefined) {
        const m = await tx.media.create({
          data: {
            url: d.secondaryImageUrl,
            publicId: d.secondaryImagePublicId ?? null,
            alt: d.secondaryImageAlt ?? null,
          },
        });
        secondaryImageMediaId = m.id;
      }
    }

    return tx.homepageExploreSettings.update({
      where: { id: HOMEPAGE_EXPLORE_ID },
      data: {
        ...(d.missionEyebrow !== undefined ? { missionEyebrow: d.missionEyebrow } : {}),
        ...(d.headlineLine1 !== undefined ? { headlineLine1: d.headlineLine1 } : {}),
        ...(d.headlineLine2 !== undefined ? { headlineLine2: d.headlineLine2 } : {}),
        ...(d.aboutEyebrow !== undefined ? { aboutEyebrow: d.aboutEyebrow } : {}),
        ...(d.aboutBody !== undefined ? { aboutBody: d.aboutBody } : {}),
        ...(d.imageBadge !== undefined ? { imageBadge: d.imageBadge } : {}),
        ...(d.imageHoverQuote !== undefined ? { imageHoverQuote: d.imageHoverQuote } : {}),
        ...(d.locationLabel !== undefined ? { locationLabel: d.locationLabel } : {}),
        ...(d.secondaryBadge !== undefined ? { secondaryBadge: d.secondaryBadge } : {}),
        ...(d.bottomBlurb !== undefined ? { bottomBlurb: d.bottomBlurb } : {}),
        ...(touchMain && mainImageMediaId ? { mainImageMediaId } : {}),
        ...(touchSecondary && secondaryImageMediaId ? { secondaryImageMediaId } : {}),
      },
      include: { mainImageMedia: true, secondaryImageMedia: true },
    });
  });

  revalidateCmsContent(["home", "about"]);
  return NextResponse.json(serialize(row));
}
