import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { prismaCmsErrorMessage } from "@/lib/cms-api-errors";
import { revalidateCmsContent } from "@/lib/cms-revalidate";
import { prisma } from "@/lib/prisma";
import type { AboutSection, Media } from "@prisma/client";

type AboutRow = AboutSection & { media: Media | null };

const createSchema = z.object({
  sortOrder: z.number().optional(),
  published: z.boolean().optional(),
  title: z.string().min(1),
  subtitle: z.string().nullable().optional(),
  body: z.string().min(1),
  layout: z.string().optional(),
  imageUrl: z.string().url().optional(),
  imagePublicId: z.string().nullable().optional(),
  imageAlt: z.string().optional(),
});

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

export async function GET(request: NextRequest) {
  const denied = await assertAdmin(request);
  if (denied) return denied;
  try {
    const rows = await prisma.aboutSection.findMany({
      orderBy: { sortOrder: "asc" },
      include: { media: true },
    });
    return NextResponse.json(rows.map(serialize));
  } catch (error) {
    console.error("[cms/about-sections GET]", error);
    return NextResponse.json({ error: prismaCmsErrorMessage(error, "load about sections") }, { status: 500 });
  }
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
    let mediaId: string | null = null;
    if (d.imageUrl) {
      const m = await tx.media.create({
        data: {
          url: d.imageUrl,
          publicId: d.imagePublicId ?? null,
          alt: d.imageAlt ?? null,
        },
      });
      mediaId = m.id;
    }
    return tx.aboutSection.create({
      data: {
        sortOrder: d.sortOrder ?? 0,
        published: d.published ?? true,
        title: d.title,
        subtitle: d.subtitle ?? null,
        body: d.body,
        layout: d.layout ?? "default",
        mediaId,
      },
      include: { media: true },
    });
  });

  revalidateCmsContent("about");
  return NextResponse.json(serialize(row));
}
