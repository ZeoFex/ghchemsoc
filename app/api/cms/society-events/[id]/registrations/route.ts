import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  parseRegistrationFormFields,
  registrationRowsForAdmin,
  type RegistrationAnswerValue,
} from "@/lib/event-registration-form";

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;

  const event = await prisma.societyEvent.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const fields = parseRegistrationFormFields(event.registrationFormFields);
  const rows = await prisma.eventRegistration.findMany({
    where: { eventId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    event: {
      id: event.id,
      title: event.title,
      registrationFormFields: event.registrationFormFields,
    },
    registrations: rows.map((r) => {
      const answers = (r.responses && typeof r.responses === "object" ? r.responses : {}) as Record<
        string,
        RegistrationAnswerValue
      >;
      return {
        id: r.id,
        createdAt: r.createdAt.toISOString(),
        read: r.read,
        summaryLine: r.summaryLine,
        lines: registrationRowsForAdmin(fields, answers),
        rawResponses: answers,
      };
    }),
  });
}

const patchSchema = z.object({
  registrationId: z.string().min(1),
  read: z.boolean(),
});

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const reg = await prisma.eventRegistration.findFirst({
    where: { id: parsed.data.registrationId, eventId: id },
  });
  if (!reg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.eventRegistration.update({
    where: { id: reg.id },
    data: { read: parsed.data.read },
  });

  return NextResponse.json({ ok: true });
}
