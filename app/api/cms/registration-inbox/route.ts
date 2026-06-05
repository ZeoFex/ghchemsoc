import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  parseRegistrationFormFields,
  registrationRowsForAdmin,
  type RegistrationAnswerValue,
} from "@/lib/event-registration-form";

export async function GET(request: NextRequest) {
  const denied = await assertAdmin(request);
  if (denied) return denied;

  const unreadOnly = request.nextUrl.searchParams.get("unread") === "1";

  const rows = await prisma.eventRegistration.findMany({
    where: unreadOnly ? { read: false } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      event: { select: { id: true, title: true, registrationFormFields: true } },
    },
  });

  return NextResponse.json(
    rows.map((r) => {
      const fields = parseRegistrationFormFields(r.event.registrationFormFields);
      const answers = (r.responses && typeof r.responses === "object" ? r.responses : {}) as Record<
        string,
        RegistrationAnswerValue
      >;
      return {
        id: r.id,
        eventId: r.eventId,
        eventTitle: r.event.title,
        createdAt: r.createdAt.toISOString(),
        read: r.read,
        summaryLine: r.summaryLine,
        lines: registrationRowsForAdmin(fields, answers),
      };
    })
  );
}

const patchSchema = z.object({
  registrationId: z.string().min(1),
  read: z.boolean(),
});

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

  const reg = await prisma.eventRegistration.findUnique({ where: { id: parsed.data.registrationId } });
  if (!reg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.eventRegistration.update({
    where: { id: reg.id },
    data: { read: parsed.data.read },
  });

  return NextResponse.json({ ok: true });
}
