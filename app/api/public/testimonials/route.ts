import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  quote: z.string().min(10),
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

  const d = parsed.data;
  // Publish immediately to the homepage carousel.
  // (If you want moderation later, switch back to TestimonialSubmission.)
  const maxOrder = await prisma.testimonial.aggregate({
    _max: { sortOrder: true },
    where: { published: true },
  });
  await prisma.testimonial.create({
    data: {
      published: true,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      name: d.name.trim(),
      role: d.role.trim(),
      quote: d.quote.trim(),
      // No photo upload in the public form yet (admin can add later in CMS if desired)
    },
  });

  return NextResponse.json({ ok: true });
}

