import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { formatZodError, prismaCmsErrorMessage } from "@/lib/cms-api-errors";
import { revalidateCmsContent } from "@/lib/cms-revalidate";
import { prisma, prismaReady } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { SITE_FOOTER_ID, serializeSiteFooterCms, siteFooterCreateData, type SiteFooterRow } from "@/lib/site-footer";

const navLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
});

const httpUrl = z
  .string()
  .min(1)
  .refine((href) => {
    try {
      const u = new URL(href);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }, "Must be a full URL starting with http:// or https://");

const socialLinkSchema = z.object({
  platform: z.enum(["linkedin", "instagram", "twitter", "facebook", "youtube", "globe"]),
  href: httpUrl,
  label: z.string().optional(),
});

const patchSchema = z
  .object({
    id: z.string().optional(),
    headlineLine1: z.string().min(1).optional(),
    headlineLine2: z.string().min(1).optional(),
    helplineText: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    copyrightText: z.string().min(1).optional(),
    trademarkLabel: z.string().min(1).optional(),
    trademarkHref: z.string().min(1).optional(),
    trademarkNotice: z.string().nullable().optional(),
    navLinks: z.array(navLinkSchema).min(1).max(12).optional(),
    socialLinks: z.array(socialLinkSchema).max(8).optional(),
    leftImageUrl: z.string().url().optional(),
    leftImagePublicId: z.string().nullable().optional(),
    leftImageAlt: z.string().optional(),
    rightImageUrl: z.string().url().optional(),
    rightImagePublicId: z.string().nullable().optional(),
    rightImageAlt: z.string().optional(),
  })
  .strict();

async function ensureRow(): Promise<SiteFooterRow> {
  let row = await prisma.siteFooterSettings.findUnique({
    where: { id: SITE_FOOTER_ID },
    include: { leftImageMedia: true, rightImageMedia: true },
  });
  if (!row) {
    row = await prisma.siteFooterSettings.create({
      data: siteFooterCreateData(),
      include: { leftImageMedia: true, rightImageMedia: true },
    });
  }
  return row;
}

async function touchImage(
  tx: Prisma.TransactionClient,
  existingId: string | null,
  url: string | undefined,
  publicId: string | null | undefined,
  alt: string | undefined
): Promise<string | null> {
  const touch = url !== undefined || publicId !== undefined || alt !== undefined;
  if (!touch) return existingId;
  if (existingId) {
    await tx.media.update({
      where: { id: existingId },
      data: {
        ...(url !== undefined ? { url } : {}),
        ...(publicId !== undefined ? { publicId } : {}),
        ...(alt !== undefined ? { alt } : {}),
      },
    });
    return existingId;
  }
  if (url === undefined) return existingId;
  const m = await tx.media.create({
    data: { url, publicId: publicId ?? null, alt: alt ?? null },
  });
  return m.id;
}

export async function GET(request: NextRequest) {
  const denied = await assertAdmin(request);
  if (denied) return denied;
  if (!(await prismaReady())) {
    return NextResponse.json(
      { error: "Content is temporarily unavailable. Please try again in a few minutes." },
      { status: 503 }
    );
  }
  try {
    const row = await ensureRow();
    return NextResponse.json(serializeSiteFooterCms(row));
  } catch (err) {
    console.error("[site-footer] GET failed:", err);
    return NextResponse.json({ error: prismaCmsErrorMessage(err, "load footer") }, { status: 500 });
  }
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
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const d = parsed.data;

  if (!(await prismaReady())) {
    return NextResponse.json(
      { error: "Content is temporarily unavailable. Please try again in a few minutes." },
      { status: 503 }
    );
  }

  try {
    let existing = await prisma.siteFooterSettings.findUnique({
      where: { id: SITE_FOOTER_ID },
      include: { leftImageMedia: true, rightImageMedia: true },
    });
    if (!existing) {
      existing = await prisma.siteFooterSettings.create({
        data: siteFooterCreateData(),
        include: { leftImageMedia: true, rightImageMedia: true },
      });
    }

    const row = await prisma.$transaction(async (tx) => {
      let leftImageMediaId = existing!.leftImageMediaId;
      let rightImageMediaId = existing!.rightImageMediaId;

      const touchLeft =
        d.leftImageUrl !== undefined || d.leftImagePublicId !== undefined || d.leftImageAlt !== undefined;
      const touchRight =
        d.rightImageUrl !== undefined || d.rightImagePublicId !== undefined || d.rightImageAlt !== undefined;

      if (touchLeft) {
        leftImageMediaId = await touchImage(tx, leftImageMediaId, d.leftImageUrl, d.leftImagePublicId, d.leftImageAlt);
      }
      if (touchRight) {
        rightImageMediaId = await touchImage(
          tx,
          rightImageMediaId,
          d.rightImageUrl,
          d.rightImagePublicId,
          d.rightImageAlt
        );
      }

      return tx.siteFooterSettings.update({
        where: { id: SITE_FOOTER_ID },
        data: {
          ...(d.headlineLine1 !== undefined ? { headlineLine1: d.headlineLine1 } : {}),
          ...(d.headlineLine2 !== undefined ? { headlineLine2: d.headlineLine2 } : {}),
          ...(d.helplineText !== undefined ? { helplineText: d.helplineText } : {}),
          ...(d.description !== undefined ? { description: d.description } : {}),
          ...(d.copyrightText !== undefined ? { copyrightText: d.copyrightText } : {}),
          ...(d.trademarkLabel !== undefined ? { trademarkLabel: d.trademarkLabel } : {}),
          ...(d.trademarkHref !== undefined ? { trademarkHref: d.trademarkHref } : {}),
          ...(d.trademarkNotice !== undefined
            ? { trademarkNotice: d.trademarkNotice?.trim() ? d.trademarkNotice.trim() : null }
            : {}),
          ...(d.navLinks !== undefined ? { navLinks: d.navLinks } : {}),
          ...(d.socialLinks !== undefined ? { socialLinks: d.socialLinks } : {}),
          ...(touchLeft && leftImageMediaId ? { leftImageMediaId } : {}),
          ...(touchRight && rightImageMediaId ? { rightImageMediaId } : {}),
        },
        include: { leftImageMedia: true, rightImageMedia: true },
      });
    });

    revalidateCmsContent("all");
    return NextResponse.json(serializeSiteFooterCms(row as SiteFooterRow));
  } catch (err) {
    console.error("[site-footer] PATCH failed:", err);
    return NextResponse.json({ error: prismaCmsErrorMessage(err, "save footer") }, { status: 500 });
  }
}
