import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { formatZodError, prismaCmsErrorMessage } from "@/lib/cms-api-errors";
import { revalidateCmsContent } from "@/lib/cms-revalidate";
import { prisma } from "@/lib/prisma";
import { serializeSocietyResource } from "@/lib/society-resources-cms";

const emptyToUndef = (v: unknown) => (typeof v === "string" && !v.trim() ? undefined : v);

const resourceSchema = z.object({
  kind: z.enum(["video", "document", "link", "other"]),
  title: z.string().min(1).max(300),
  description: z.string().min(1),
  url: z.preprocess(emptyToUndef, z.string().url().optional()),
  urlPublicId: z.string().nullable().optional(),
  published: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  publishedAt: z.coerce.date().nullable().optional(),
  imageUrl: z.preprocess(emptyToUndef, z.string().url().optional()),
  imagePublicId: z.string().nullable().optional(),
  imageAlt: z.preprocess(emptyToUndef, z.string().optional()),
});

export async function GET(request: NextRequest) {
  const denied = await assertAdmin(request);
  if (denied) return denied;
  try {
    const rows = await prisma.societyResource.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { media: true },
    });
    return NextResponse.json(rows.map(serializeSocietyResource));
  } catch (error) {
    console.error("[cms/society-resources GET]", error);
    return NextResponse.json({ error: prismaCmsErrorMessage(error, "load resources") }, { status: 500 });
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
  const parsed = resourceSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const d = parsed.data;

  try {
    const row = await prisma.$transaction(async (tx) => {
      let mediaId: string | null = null;
      if (d.imageUrl) {
        const m = await tx.media.create({
          data: {
            url: d.imageUrl,
            publicId: d.imagePublicId ?? null,
            alt: d.imageAlt ?? d.title,
          },
        });
        mediaId = m.id;
      }
      return tx.societyResource.create({
        data: {
          kind: d.kind,
          title: d.title.trim(),
          description: d.description.trim(),
          url: d.url?.trim() ?? null,
          urlPublicId: d.urlPublicId ?? null,
          published: d.published ?? true,
          sortOrder: d.sortOrder ?? 0,
          publishedAt: d.publishedAt ?? null,
          mediaId,
        },
        include: { media: true },
      });
    });
    revalidateCmsContent("resources");
    return NextResponse.json(serializeSocietyResource(row));
  } catch (error) {
    console.error("[cms/society-resources POST]", error);
    return NextResponse.json({ error: prismaCmsErrorMessage(error, "create resource") }, { status: 500 });
  }
}
