import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact/contact-form";
import { Header } from "@/components/layout/header";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { getContactSettings } from "@/lib/cms-queries";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description: "Reach the Ghana Chemical Society secretariat for membership, partnerships, and enquiries.",
  path: "/contact",
});

type CardIcon = "phone" | "mail" | "map" | "clock";

type ContactCard = {
  icon: CardIcon;
  title: string;
  value: string;
  description: string;
};

const defaultCards: ContactCard[] = [
  { icon: "phone", title: "Phone", value: "+233 30 000 0000", description: "Secretariat hours · weekdays" },
  { icon: "mail", title: "Email", value: "secretariat@ghanachemicalsociety.org", description: "We reply within a few business days" },
  { icon: "map", title: "Location", value: "Accra, Ghana", description: "National coordinating office" },
  { icon: "clock", title: "Hours", value: "09:00 – 17:00 GMT", description: "Monday to Friday" },
];

function iconFor(key: CardIcon) {
  switch (key) {
    case "phone":
      return Phone;
    case "mail":
      return Mail;
    case "map":
      return MapPin;
    case "clock":
      return Clock;
    default:
      return MessageCircle;
  }
}

function normalizeCards(raw: unknown): ContactCard[] {
  if (!Array.isArray(raw) || raw.length === 0) return defaultCards;
  const out: ContactCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const icon = o.icon === "phone" || o.icon === "mail" || o.icon === "map" || o.icon === "clock" ? o.icon : "mail";
    const title = typeof o.title === "string" ? o.title : "";
    const value = typeof o.value === "string" ? o.value : "";
    const description = typeof o.description === "string" ? o.description : "";
    if (title && value) out.push({ icon, title, value, description });
  }
  return out.length ? out : defaultCards;
}

export default async function ContactPage() {
  const row = await getContactSettings();
  const eyebrow = row?.eyebrow ?? "Contact";
  const headline = row?.headline ?? "We are here to help";
  const subtext =
    row?.subtext ??
    "Reach the Ghana Chemical Society secretariat for membership, partnerships, and media enquiries.";
  const cards = normalizeCards(row?.cards);

  return (
    <main className="min-h-screen bg-white text-gcs-foreground" data-aos="fade-up">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <Header />

      <section className="border-b border-gcs-border/60 bg-gcs-surface pb-12 pt-28 md:pb-16 md:pt-32">
        <div className="mx-auto max-w-[1440px] px-4 text-center sm:px-6 md:px-12">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-gcs-border bg-white px-4 py-1.5 text-sm font-medium text-gcs-muted-text shadow-sm">
            <MessageCircle className="h-4 w-4 text-gcs-primary" aria-hidden />
            {eyebrow}
          </div>
          <h1 className="gcs-page-title mt-6">{headline}</h1>
          <p className="gcs-lead mx-auto mt-5 max-w-2xl">{subtext}</p>
        </div>
      </section>

      <section className="px-4 py-12 md:px-12 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="overflow-hidden rounded-[1.75rem] border border-gcs-border/70 bg-gcs-surface shadow-sm ring-1 ring-gcs-border/20 md:rounded-[2rem]">
            <div className="grid grid-cols-1 gap-0 lg:grid-cols-5">
              <div className="border-b border-gcs-border/60 p-6 md:p-10 lg:col-span-3 lg:border-b-0 lg:border-r">
                <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Send a message</h2>
                <p className="mt-2 text-sm text-gcs-muted-text">
                  This form is for enquiries routed to the secretariat. For urgent safety matters, use official emergency
                  channels in your locality.
                </p>
                <ContactForm />
              </div>

              <div className="border-t border-gcs-border/50 bg-white p-6 md:border-t-0 md:border-l md:p-10 lg:col-span-2">
                <h3 className="text-lg font-semibold tracking-tight">Direct details</h3>
                <p className="mt-2 text-sm text-gcs-muted-text">Contact details are managed by the society secretariat and updated on this page when needed.</p>
                <ul className="mt-8 space-y-6">
                  {cards.map((item) => {
                    const Icon = iconFor(item.icon);
                    return (
                      <li key={`${item.title}-${item.value}`} className="flex gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gcs-border/60 bg-gcs-surface text-gcs-primary shadow-sm">
                          <Icon className="h-5 w-5" aria-hidden />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gcs-muted-text">{item.title}</p>
                          <p className="mt-1 break-words font-semibold text-gcs-foreground">{item.value}</p>
                          <p className="mt-1 text-sm text-gcs-muted-text">{item.description}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-10 rounded-2xl border border-gcs-border/60 bg-gcs-surface p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gcs-muted-text">Quick links</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href="/membership"
                      className="rounded-full border border-gcs-border bg-white px-4 py-2 text-sm font-medium text-gcs-foreground shadow-sm transition-colors hover:border-gcs-primary hover:bg-neutral-50 hover:text-gcs-primary"
                    >
                      Membership
                    </Link>
                    <Link
                      href="/events"
                      className="rounded-full border border-gcs-border bg-white px-4 py-2 text-sm font-medium text-gcs-foreground shadow-sm transition-colors hover:border-gcs-primary hover:bg-neutral-50 hover:text-gcs-primary"
                    >
                      Events
                    </Link>
                    <Link
                      href="/news"
                      className="rounded-full border border-gcs-border bg-white px-4 py-2 text-sm font-medium text-gcs-foreground shadow-sm transition-colors hover:border-gcs-primary hover:bg-neutral-50 hover:text-gcs-primary"
                    >
                      News
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
