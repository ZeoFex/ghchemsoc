import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { revalidateCmsContent } from "@/lib/cms-revalidate";
import { prisma } from "@/lib/prisma";
import type { JoinPageHeader, Media } from "@prisma/client";

type HeaderRow = JoinPageHeader & { media: Media | null };

const patchSchema = z
  .object({
    eyebrow: z.string().optional(),
    title: z.string().min(1).optional(),
    subtitle: z.string().min(1).optional(),
    imageUrl: z.string().url().optional(),
    imagePublicId: z.string().nullable().optional(),
    imageAlt: z.string().optional(),
  })
  .strict();

function serialize(r: HeaderRow) {
  return {
    id: r.id,
    key: r.key,
    eyebrow: r.eyebrow,
    title: r.title,
    subtitle: r.subtitle,
    mediaId: r.mediaId,
    imageUrl: r.media?.url ?? "",
    imagePublicId: r.media?.publicId ?? null,
    imageAlt: r.media?.alt ?? "",
  };
}

export async function GET(request: NextRequest) {
  const denied = await assertAdmin(request);
  if (denied) return denied;
  let row = await prisma.joinPageHeader.findUnique({
    where: { key: "join_page_header" },
    include: { media: true },
  });
  if (!row) {
    row = await prisma.joinPageHeader.create({
      data: {
        key: "join_page_header",
        eyebrow: "Membership",
        title: "How will I join?",
        subtitle: "One clear path in four steps.",
      },
      include: { media: true },
    });
  }
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

  let existing = await prisma.joinPageHeader.findUnique({
    where: { key: "join_page_header" },
    include: { media: true },
  });
  if (!existing) {
    existing = await prisma.joinPageHeader.create({
      data: {
        key: "join_page_header",
        eyebrow: d.eyebrow ?? "Membership",
        title: d.title ?? "How will I join?",
        subtitle: d.subtitle ?? "One clear path in four steps.",
      },
      include: { media: true },
    });
  }

  const row = await prisma.$transaction(async (tx) => {
    if (d.imageUrl !== undefined || d.imagePublicId !== undefined || d.imageAlt !== undefined) {
      if (existing!.mediaId) {
        await tx.media.update({
          where: { id: existing!.mediaId },
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
        await tx.joinPageHeader.update({
          where: { key: "join_page_header" },
          data: { mediaId: m.id },
        });
      }
    }

    return tx.joinPageHeader.update({
      where: { key: "join_page_header" },
      data: {
        ...(d.eyebrow !== undefined ? { eyebrow: d.eyebrow } : {}),
        ...(d.title !== undefined ? { title: d.title } : {}),
        ...(d.subtitle !== undefined ? { subtitle: d.subtitle } : {}),
      },
      include: { media: true },
    });
  });

  revalidateCmsContent(["home", "membership"]);
  return NextResponse.json(serialize(row));
}
