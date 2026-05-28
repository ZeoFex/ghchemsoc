import { NextResponse } from "next/server";
import { getContactSettings } from "@/lib/cms-queries";

function defaultCards() {
  return [
    { icon: "phone", title: "Phone", value: "+233 30 000 0000", description: "Secretariat hours · weekdays" },
    { icon: "mail", title: "Email", value: "secretariat@ghanachemicalsociety.org", description: "We reply within a few business days" },
    { icon: "map", title: "Location", value: "Accra, Ghana", description: "National coordinating office" },
    { icon: "clock", title: "Hours", value: "09:00 – 17:00 GMT", description: "Monday to Friday" },
  ];
}

export async function GET() {
  const row = await getContactSettings();
  if (!row) {
    return NextResponse.json({
      eyebrow: "Contact",
      headline: "We are here to help",
      subtext: "Reach the Ghana Chemical Society secretariat for membership, partnerships, and media enquiries.",
      cards: defaultCards(),
    });
  }
  const cards = Array.isArray(row.cards) ? row.cards : defaultCards();
  return NextResponse.json({
    eyebrow: row.eyebrow,
    headline: row.headline,
    subtext: row.subtext,
    cards,
  });
}
