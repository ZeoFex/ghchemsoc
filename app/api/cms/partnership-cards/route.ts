import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { revalidateCmsContent } from "@/lib/cms-revalidate";
import { prisma } from "@/lib/prisma";
import type { Media, PartnershipCard } from "@prisma/client";

type Row = PartnershipCard & { media: Media | null };

function serialize(r: Row) {
  return {
    id: r.id,
    published: r.published,
    sortOrder: r.sortOrder,
    tag: r.tag,
    title: r.title,
    accentPill: r.accentPill ?? "",
    href: r.href ?? "",
    imageUrl: r.media?.url ?? "",
    imagePublicId: r.media?.publicId ?? null,
    imageAlt: r.media?.alt ?? "",
  };
}

const createSchema = z.object({
  tag: z.string().min(1),
  title: z.string().min(1),
  accentPill: z.string().optional(),
  href: z.string().optional(),
  published: z.boolean().optional(),
  sortOrder: z.number().optional(),
  imageUrl: z.string().url(),
  imagePublicId: z.string().nullable().optional(),
  imageAlt: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const denied = await assertAdmin(request);
  if (denied) return denied;
  const rows = await prisma.partnershipCard.findMany({
    orderBy: { sortOrder: "asc" },
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
        alt: d.imageAlt ?? d.title,
      },
    });
    return tx.partnershipCard.create({
      data: {
        tag: d.tag,
        title: d.title,
        accentPill: d.accentPill?.trim() ? d.accentPill.trim() : null,
        href: d.href?.trim() ? d.href.trim() : null,
        published: d.published ?? true,
        sortOrder: d.sortOrder ?? 0,
        mediaId: m.id,
      },
      include: { media: true },
    });
  });

  revalidateCmsContent("home");
  return NextResponse.json(serialize(row));
}
