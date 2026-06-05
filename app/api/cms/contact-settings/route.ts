import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { revalidateCmsContent } from "@/lib/cms-revalidate";
import { prisma } from "@/lib/prisma";

const cardSchema = z.object({
  icon: z.enum(["phone", "mail", "map", "clock"]),
  title: z.string().min(1),
  value: z.string().min(1),
  description: z.string().min(1),
});

const patchSchema = z.object({
  eyebrow: z.string().min(1).optional(),
  headline: z.string().min(1).optional(),
  subtext: z.string().min(1).optional(),
  cards: z.array(cardSchema).min(1).max(8).optional(),
});

export async function GET(request: NextRequest) {
  const denied = await assertAdmin(request);
  if (denied) return denied;

  let row = await prisma.contactSettings.findUnique({ where: { id: "contact" } });
  if (!row) {
    row = await prisma.contactSettings.create({
      data: {
        id: "contact",
        eyebrow: "Contact",
        headline: "We are here to help",
        subtext:
          "Reach the Ghana Chemical Society secretariat for membership, partnerships, and media enquiries.",
        cards: [
          { icon: "phone", title: "Phone", value: "+233 30 000 0000", description: "Secretariat hours · weekdays" },
          { icon: "mail", title: "Email", value: "secretariat@ghanachemicalsociety.org", description: "We reply within a few business days" },
          { icon: "map", title: "Location", value: "Accra, Ghana", description: "National coordinating office" },
          { icon: "clock", title: "Hours", value: "09:00 – 17:00 GMT", description: "Monday to Friday" },
        ],
      },
    });
  }

  return NextResponse.json({
    id: row.id,
    eyebrow: row.eyebrow,
    headline: row.headline,
    subtext: row.subtext,
    cards: row.cards,
  });
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

  const row = await prisma.contactSettings.upsert({
    where: { id: "contact" },
    create: {
      id: "contact",
      eyebrow: d.eyebrow ?? "Contact",
      headline: d.headline ?? "We are here to help",
      subtext: d.subtext ?? "",
      cards: d.cards ?? [],
    },
    update: {
      ...(d.eyebrow !== undefined ? { eyebrow: d.eyebrow } : {}),
      ...(d.headline !== undefined ? { headline: d.headline } : {}),
      ...(d.subtext !== undefined ? { subtext: d.subtext } : {}),
      ...(d.cards !== undefined ? { cards: d.cards } : {}),
    },
  });

  revalidateCmsContent(["contact", "home"]);
  return NextResponse.json({
    id: row.id,
    eyebrow: row.eyebrow,
    headline: row.headline,
    subtext: row.subtext,
    cards: row.cards,
  });
}
