import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { prismaCmsErrorMessage } from "@/lib/cms-api-errors";
import { revalidateCmsContent } from "@/lib/cms-revalidate";
import { prisma } from "@/lib/prisma";
import { RESOURCES_PAGE_DEFAULTS, RESOURCES_PAGE_ID } from "@/lib/resources-page";

const patchSchema = z.object({
  eyebrow: z.string().min(1).optional(),
  headline: z.string().min(1).optional(),
  lead: z.string().min(1).optional(),
});

export async function GET(request: NextRequest) {
  const denied = await assertAdmin(request);
  if (denied) return denied;
  try {
    let row = await prisma.resourcesPageSettings.findUnique({
      where: { id: RESOURCES_PAGE_ID },
    });
    if (!row) {
      row = await prisma.resourcesPageSettings.create({
        data: {
          id: RESOURCES_PAGE_ID,
          eyebrow: RESOURCES_PAGE_DEFAULTS.eyebrow,
          headline: RESOURCES_PAGE_DEFAULTS.headline,
          lead: RESOURCES_PAGE_DEFAULTS.lead,
        },
      });
    }
    return NextResponse.json({
      eyebrow: row.eyebrow,
      headline: row.headline,
      lead: row.lead,
    });
  } catch (error) {
    console.error("[cms/resources-page GET]", error);
    return NextResponse.json({ error: prismaCmsErrorMessage(error, "load resources page") }, { status: 500 });
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
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  try {
    const row = await prisma.resourcesPageSettings.upsert({
      where: { id: RESOURCES_PAGE_ID },
      create: {
        id: RESOURCES_PAGE_ID,
        eyebrow: d.eyebrow ?? RESOURCES_PAGE_DEFAULTS.eyebrow,
        headline: d.headline ?? RESOURCES_PAGE_DEFAULTS.headline,
        lead: d.lead ?? RESOURCES_PAGE_DEFAULTS.lead,
      },
      update: {
        ...(d.eyebrow !== undefined ? { eyebrow: d.eyebrow } : {}),
        ...(d.headline !== undefined ? { headline: d.headline } : {}),
        ...(d.lead !== undefined ? { lead: d.lead } : {}),
      },
    });
    revalidateCmsContent("resources");
    return NextResponse.json({
      eyebrow: row.eyebrow,
      headline: row.headline,
      lead: row.lead,
    });
  } catch (error) {
    console.error("[cms/resources-page PATCH]", error);
    return NextResponse.json({ error: prismaCmsErrorMessage(error, "save resources page") }, { status: 500 });
  }
}
