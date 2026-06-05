import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { prismaCmsErrorMessage } from "@/lib/cms-api-errors";
import { revalidateCmsContent } from "@/lib/cms-revalidate";
import { prisma } from "@/lib/prisma";
import type { Media, Testimonial } from "@prisma/client";

type Row = Testimonial & { media: Media | null };

const createSchema = z.object({
  sortOrder: z.number().optional(),
  published: z.boolean().optional(),
  name: z.string().min(1),
  role: z.string().min(1),
  quote: z.string().min(1),
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
    quote: r.quote,
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
    const rows = await prisma.testimonial.findMany({
      orderBy: { sortOrder: "asc" },
      include: { media: true },
    });
    return NextResponse.json(rows.map(serialize));
  } catch (error) {
    console.error("[cms/testimonials GET]", error);
    return NextResponse.json({ error: prismaCmsErrorMessage(error, "load testimonials") }, { status: 500 });
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
      return tx.testimonial.create({
        data: {
          sortOrder: d.sortOrder ?? 0,
          published: d.published ?? true,
          name: d.name,
          role: d.role,
          quote: d.quote.trim(),
          mediaId,
        },
        include: { media: true },
      });
    });
    revalidateCmsContent("home");
    return NextResponse.json(serialize(row));
  } catch (error) {
    console.error("[cms/testimonials POST]", error);
    return NextResponse.json({ error: prismaCmsErrorMessage(error, "create testimonial") }, { status: 500 });
  }
}

