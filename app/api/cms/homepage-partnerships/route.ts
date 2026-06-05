import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { revalidateCmsContent } from "@/lib/cms-revalidate";
import { prisma } from "@/lib/prisma";
import {
  HOMEPAGE_PARTNERSHIPS_ID,
  homepagePartnershipsSettingsCreateData,
} from "@/lib/homepage-partnerships";

const patchSchema = z
  .object({
    eyebrow: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    searchPlaceholder: z.string().min(1).optional(),
    showSearch: z.boolean().optional(),
    ctaLabel: z.string().min(1).optional(),
    ctaHref: z.string().min(1).optional(),
    footerNote: z.string().nullable().optional(),
  })
  .strict();

function serialize(row: {
  id: string;
  eyebrow: string;
  title: string;
  searchPlaceholder: string;
  showSearch: boolean;
  ctaLabel: string;
  ctaHref: string;
  footerNote: string | null;
}) {
  return {
    id: row.id,
    eyebrow: row.eyebrow,
    title: row.title,
    searchPlaceholder: row.searchPlaceholder,
    showSearch: row.showSearch,
    ctaLabel: row.ctaLabel,
    ctaHref: row.ctaHref,
    footerNote: row.footerNote ?? "",
  };
}

async function ensureSettings() {
  let row = await prisma.homepagePartnershipsSettings.findUnique({
    where: { id: HOMEPAGE_PARTNERSHIPS_ID },
  });
  if (!row) {
    row = await prisma.homepagePartnershipsSettings.create({
      data: homepagePartnershipsSettingsCreateData(),
    });
  }
  return row;
}

export async function GET(request: NextRequest) {
  const denied = await assertAdmin(request);
  if (denied) return denied;
  return NextResponse.json(serialize(await ensureSettings()));
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

  await ensureSettings();
  const row = await prisma.homepagePartnershipsSettings.update({
    where: { id: HOMEPAGE_PARTNERSHIPS_ID },
    data: {
      ...(d.eyebrow !== undefined ? { eyebrow: d.eyebrow } : {}),
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.searchPlaceholder !== undefined ? { searchPlaceholder: d.searchPlaceholder } : {}),
      ...(d.showSearch !== undefined ? { showSearch: d.showSearch } : {}),
      ...(d.ctaLabel !== undefined ? { ctaLabel: d.ctaLabel } : {}),
      ...(d.ctaHref !== undefined ? { ctaHref: d.ctaHref } : {}),
      ...(d.footerNote !== undefined ? { footerNote: d.footerNote?.trim() ? d.footerNote.trim() : null } : {}),
    },
  });

  revalidateCmsContent("home");
  return NextResponse.json(serialize(row));
}
