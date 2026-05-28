import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { prismaCmsErrorMessage } from "@/lib/cms-api-errors";
import { prisma } from "@/lib/prisma";

function fmtLines(r: {
  name: string;
  role: string;
  email: string;
  phone: string | null;
  quote: string;
}) {
  return [
    { label: "Name", value: r.name },
    { label: "Role / affiliation", value: r.role },
    { label: "Email", value: r.email },
    ...(r.phone ? [{ label: "Phone", value: r.phone }] : []),
    { label: "Quote", value: r.quote },
  ];
}

export async function GET(request: NextRequest) {
  const denied = await assertAdmin(request);
  if (denied) return denied;
  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "1";
    const status = searchParams.get("status");
    const statusFilter =
      status === "pending" || status === "approved" || status === "rejected" ? status : undefined;

    const rows = await prisma.testimonialSubmission.findMany({
      where: {
        ...(unreadOnly ? { read: false } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      orderBy: [{ read: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        createdAt: r.createdAt.toISOString(),
        read: r.read,
        status: r.status,
        summaryLine: `${r.name} · ${r.role}`,
        lines: fmtLines(r),
      }))
    );
  } catch (error) {
    console.error("[cms/testimonial-inbox GET]", error);
    return NextResponse.json({ error: prismaCmsErrorMessage(error, "load testimonial inbox") }, { status: 500 });
  }
}

const patchSchema = z
  .object({
    submissionId: z.string().min(1),
    read: z.boolean().optional(),
    status: z.enum(["pending", "approved", "rejected"]).optional(),
    approveToHomepage: z.boolean().optional(),
  })
  .strict();

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

  const existing = await prisma.testimonialSubmission.findUnique({ where: { id: d.submissionId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await prisma.$transaction(async (tx) => {
      if (d.approveToHomepage) {
        await tx.testimonial.create({
          data: {
            published: true,
            sortOrder: 0,
            name: existing.name,
            role: existing.role,
            quote: existing.quote,
          },
        });
        await tx.testimonialSubmission.update({
          where: { id: existing.id },
          data: { status: "approved", read: true },
        });
        return;
      }

      await tx.testimonialSubmission.update({
        where: { id: existing.id },
        data: {
          ...(d.read !== undefined ? { read: d.read } : {}),
          ...(d.status !== undefined ? { status: d.status } : {}),
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[cms/testimonial-inbox PATCH]", error);
    return NextResponse.json({ error: prismaCmsErrorMessage(error, "update testimonial inbox") }, { status: 500 });
  }
}

