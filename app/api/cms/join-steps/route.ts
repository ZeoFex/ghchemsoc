import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { revalidateCmsContent } from "@/lib/cms-revalidate";
import { prisma } from "@/lib/prisma";
import type { JoinStep, Media } from "@prisma/client";

type StepRow = JoinStep & { media: Media | null };

const createSchema = z.object({
  sortOrder: z.number().optional(),
  published: z.boolean().optional(),
  stepKey: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  imageUrl: z.string().url().optional(),
  imagePublicId: z.string().nullable().optional(),
  imageAlt: z.string().optional(),
});

function serialize(r: StepRow) {
  return {
    id: r.id,
    sortOrder: r.sortOrder,
    published: r.published,
    stepKey: r.stepKey,
    title: r.title,
    description: r.description,
    mediaId: r.mediaId,
    imageUrl: r.media?.url ?? "",
    imagePublicId: r.media?.publicId ?? null,
    imageAlt: r.media?.alt ?? "",
  };
}

export async function GET(request: NextRequest) {
  const denied = await assertAdmin(request);
  if (denied) return denied;
  const rows = await prisma.joinStep.findMany({
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
    return tx.joinStep.create({
      data: {
        sortOrder: d.sortOrder ?? 0,
        published: d.published ?? true,
        stepKey: d.stepKey,
        title: d.title,
        description: d.description,
        mediaId,
      },
      include: { media: true },
    });
  });

  revalidateCmsContent(["home", "membership"]);
  return NextResponse.json(serialize(row));
}
