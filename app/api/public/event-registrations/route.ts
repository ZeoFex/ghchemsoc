import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  buildRegistrationSummaryLine,
  parseRegistrationFormFields,
  validateRegistrationAnswers,
} from "@/lib/event-registration-form";

const fileAnswerSchema = z.object({
  url: z.string().url(),
  fileName: z.string().min(1).max(200),
  publicId: z.string().optional(),
  mime: z.string().optional(),
  bytes: z.number().int().nonnegative().optional(),
});

const answerValueSchema = z.union([z.string(), z.array(z.string()), fileAnswerSchema]);

const bodySchema = z.object({
  eventId: z.string().min(1),
  answers: z.record(z.string(), answerValueSchema).optional(),
});

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const event = await prisma.societyEvent.findFirst({
    where: { id: parsed.data.eventId, published: true },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const fields = parseRegistrationFormFields(event.registrationFormFields);
  if (!fields.length) {
    return NextResponse.json({ error: "Registration is not open for this event" }, { status: 400 });
  }

  const checked = validateRegistrationAnswers(fields, parsed.data.answers ?? {});
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });

  const summaryLine = buildRegistrationSummaryLine(fields, checked.answers);

  await prisma.eventRegistration.create({
    data: {
      eventId: event.id,
      responses: checked.answers as object,
      summaryLine,
    },
  });

  return NextResponse.json({ ok: true });
}
