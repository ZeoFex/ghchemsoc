import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { prismaCmsErrorMessage } from "@/lib/cms-api-errors";
import { revalidateCmsContent } from "@/lib/cms-revalidate";
import { prisma } from "@/lib/prisma";
import type { Executive, Media } from "@prisma/client";

type Row = Executive & { media: Media | null };

const createSchema = z.object({
  sortOrder: z.number().optional(),
  published: z.boolean().optional(),
  name: z.string().min(1),
  role: z.string().min(1),
  bio: z.string().nullable().optional(),
  imageUrl: z.string().url().optional(),
  imagePublicId: z.string().nullable().optional(),
  imageAlt: z.string().optional(),
});

function serialize(r: Row) {
  return {
    id: r.id,
    sortOrder: r.sortOrder,
    published: r.published,
    name: r.name,
    role: r.role,
    bio: r.bio,
    mediaId: r.mediaId,
    imageUrl: r.media?.url ?? "",
    imagePublicId: r.media?.publicId ?? null,
    imageAlt: r.media?.alt ?? "",
  };
}

export async function GET(request: NextRequest) {
  const denied = await assertAdmin(request);
  if (denied) return denied;
  try {
    const rows = await prisma.executive.findMany({
      orderBy: { sortOrder: "asc" },
      include: { media: true },
    });
    return NextResponse.json(rows.map(serialize));
  } catch (error) {
    console.error("[cms/executives GET]", error);
    return NextResponse.json({ error: prismaCmsErrorMessage(error, "load executives") }, { status: 500 });
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

  try {
    const row = await prisma.$transaction(async (tx) => {
      let mediaId: string | null = null;
      if (d.imageUrl) {
        const m = await tx.media.create({
          data: {
            url: d.imageUrl,
            publicId: d.imagePublicId ?? null,
            alt: d.imageAlt ?? d.name,
          },
        });
        mediaId = m.id;
      }
      return tx.executive.create({
        data: {
          sortOrder: d.sortOrder ?? 0,
          published: d.published ?? true,
          name: d.name,
          role: d.role,
          bio: d.bio?.trim() ? d.bio.trim() : null,
          mediaId,
        },
        include: { media: true },
      });
    });
    revalidateCmsContent("executives");
    return NextResponse.json(serialize(row));
  } catch (error) {
    console.error("[cms/executives POST]", error);
    return NextResponse.json({ error: prismaCmsErrorMessage(error, "create executive") }, { status: 500 });
  }
}
