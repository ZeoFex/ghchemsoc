import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  fieldTypeIsFile,
  parseRegistrationFormFields,
} from "@/lib/event-registration-form";
import { uploadEventRegistrationFileFromForm } from "@/lib/event-registration-upload";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const eventId = String(form.get("eventId") ?? "").trim();
    const fieldId = String(form.get("fieldId") ?? "").trim();
    const file = form.get("file");

    if (!eventId || !fieldId) {
      return NextResponse.json({ error: "eventId and fieldId are required" }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Expected file field" }, { status: 400 });
    }

    const event = await prisma.societyEvent.findFirst({
      where: { id: eventId, published: true },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const fields = parseRegistrationFormFields(event.registrationFormFields);
    const field = fields.find((f) => f.id === fieldId);
    if (!field || !fieldTypeIsFile(field.type)) {
      return NextResponse.json({ error: "Invalid file field for this event" }, { status: 400 });
    }

    const uploaded = await uploadEventRegistrationFileFromForm(file, field);
    return NextResponse.json({ file: uploaded });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    console.error("[public/event-registration-upload]", error);
    const status =
      message.includes("not configured") || message.includes("Allowed file") || message.includes("under 10")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
