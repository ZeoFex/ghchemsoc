import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, buildMetadata, eventJsonLd } from "@/lib/seo";
import { getPublishedSocietyEventById, getPublishedSocietyEvents } from "@/lib/cms-queries";
import { formatEventDates } from "@/lib/event-format";
import { EventAboutSection } from "@/components/events/event-about-section";
import { EventRegisterCta } from "@/components/events/event-register-cta";
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
} from "lucide-react";

type PageProps = { params: Promise<{ id: string }> };

/** Event detail hero — full image visible (no crop). Fits main column beside 340px sidebar. */
const EVENT_DETAIL_IMAGE_WIDTH_PX = 820;
const EVENT_DETAIL_IMAGE_HEIGHT_PX = 520;

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params;
  const event = await getPublishedSocietyEventById(id);
  if (!event) {
    return buildMetadata({ title: "Event not found", path: `/events/${id}`, noIndex: true });
  }
  return buildMetadata({
    title: event.title,
    description: event.excerpt,
    path: `/events/${id}`,
    image: event.media?.url,
    imageAlt: event.media?.alt ?? event.title,
    absoluteTitle: true,
  });
}

export default async function EventDetailPage(props: PageProps) {
  const { id } = await props.params;
  const event = await getPublishedSocietyEventById(id);
  if (!event) notFound();

  const all = await getPublishedSocietyEvents();
  const related = all.filter((e) => e.id !== event.id).slice(0, 3);
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Events", path: "/events" },
            { name: event.title },
          ]),
          eventJsonLd({
            title: event.title,
            description: event.excerpt,
            path: `/events/${id}`,
            image: event.media?.url,
            startDate: event.startDate,
            endDate: event.endDate,
            location: event.location,
          }),
        ]}
      />
      <Header />
      <main className="relative min-h-screen pb-24 pt-24 md:pb-32 md:pt-28">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-gradient-to-b from-white via-white to-neutral-50/35">
          <div className="absolute -right-24 top-0 h-[min(520px,90vw)] w-[min(520px,90vw)] rounded-full bg-gcs-primary/[0.06] blur-3xl" />
          <div className="absolute -left-32 bottom-1/4 h-[420px] w-[420px] rounded-full bg-sky-400/15 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.04] [background-image:radial-gradient(circle_at_1px_1px,#1e40af_1px,transparent_0)] [background-size:22px_22px]"
            aria-hidden
          />
        </div>

        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 md:px-10">
          <nav
            className="flex flex-wrap items-center gap-2 text-sm text-gcs-muted-text"
            aria-label="Breadcrumb"
            data-aos="fade-down"
            data-aos-duration="600"
          >
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 font-medium text-gcs-primary transition-colors hover:text-gcs-primary-hover"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              All events
            </Link>
            <span className="text-gcs-border" aria-hidden>
              /
            </span>
            <span className="max-w-[min(100%,28rem)] truncate text-gcs-foreground">{event.title}</span>
          </nav>

          <header className="mt-10 md:mt-12" data-aos="fade-up" data-aos-duration="700">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-gcs-muted-text">
              {event.badge ? (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-gcs-border/80 bg-gcs-surface px-3 py-1 text-gcs-primary">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                    {event.badge}
                  </span>
                  <span className="hidden h-1 w-1 rounded-full bg-gcs-border sm:inline" aria-hidden />
                </>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-gcs-primary" aria-hidden />
                <time dateTime={event.startDate.toISOString()}>{formatEventDates(event.startDate, event.endDate)}</time>
              </span>
            </div>
            <h1 className="mt-5 max-w-4xl text-3xl font-semibold tracking-tight text-gcs-foreground md:text-4xl md:leading-[1.15] lg:text-[2.5rem]">
              {event.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-gcs-muted-text md:text-lg">{event.excerpt}</p>
          </header>

          <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-[1fr_340px] lg:items-start lg:gap-12">
            <div className="min-w-0 space-y-8" data-aos="fade-up" data-aos-delay="80" data-aos-duration="700">
              <div className="overflow-hidden rounded-[1.5rem] border border-gcs-border/60 bg-gcs-surface shadow-sm ring-1 ring-gcs-border/20">
                <div
                  className="relative mx-auto h-[360px] w-full max-w-[820px] bg-neutral-50 sm:h-[440px] lg:h-[520px]"
                  style={{ maxWidth: EVENT_DETAIL_IMAGE_WIDTH_PX }}
                >
                  {event.media?.url ? (
                    <Image
                      src={event.media.url}
                      alt={event.media.alt ?? event.title}
                      fill
                      className="object-contain object-center"
                      sizes={`(max-width: 640px) 100vw, (max-width: 1024px) 100vw, ${EVENT_DETAIL_IMAGE_WIDTH_PX}px`}
                      priority
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-gcs-muted-text">
                      No image
                    </div>
                  )}
                </div>
              </div>

              {/* Collapsible about — see EventAboutSection */}
              <EventAboutSection body={event.body} excerpt={event.excerpt} />
            </div>

            <aside
              className="lg:sticky lg:top-28"
              data-aos="fade-up"
              data-aos-delay="120"
              data-aos-duration="700"
            >
              <div className="overflow-hidden rounded-[1.35rem] border border-gcs-border/60 bg-white p-6 shadow-md ring-1 ring-gcs-border/15 md:p-8">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gcs-muted-text">Logistics</h2>
                <ul className="mt-6 space-y-5 text-sm">
                  <li className="flex gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gcs-primary/10 text-gcs-primary">
                      <Clock className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <p className="font-semibold text-gcs-foreground">Schedule</p>
                      <p className="mt-1 text-gcs-muted-text">{event.timeLabel}</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gcs-primary/10 text-gcs-primary">
                      <MapPin className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <p className="font-semibold text-gcs-foreground">Venue</p>
                      <p className="mt-1 text-gcs-muted-text">{event.location}</p>
                    </div>
                  </li>
                  <EventRegisterCta eventId={event.id} registrationFormFields={event.registrationFormFields} />
                </ul>
              </div>
            </aside>
          </div>

          {related.length ? (
            <section
              className="mt-20 border-t border-gcs-border/70 pt-16 md:mt-24 md:pt-20"
              aria-labelledby="related-events"
              data-aos="fade-up"
              data-aos-duration="700"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <h2 id="related-events" className="text-xl font-semibold tracking-tight text-gcs-foreground md:text-2xl">
                    More on the calendar
                  </h2>
                  <p className="mt-2 max-w-lg text-sm text-gcs-muted-text">Other published meetings and symposia from the society.</p>
                </div>
                <Link
                  href="/events"
                  className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-gcs-primary hover:text-gcs-primary-hover"
                >
                  View all
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
              <ul className="mt-10 grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((e, idx) => (
                  <li key={e.id} data-aos="fade-up" data-aos-delay={String(60 + idx * 70)} data-aos-duration="650">
                    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gcs-border/50 bg-gcs-surface shadow-sm ring-1 ring-gcs-border/10 transition-shadow hover:shadow-md">
                      <Link href={`/events/${e.id}`} className="flex flex-1 flex-col">
                        <div className="relative aspect-[16/10] w-full bg-neutral-50">
                          {e.media?.url ? (
                            <Image
                              src={e.media.url}
                              alt={e.media.alt ?? e.title}
                              fill
                              className="object-cover transition duration-500 group-hover:scale-[1.03]"
                              sizes="(max-width: 640px) 100vw, 33vw"
                            />
                          ) : null}
                        </div>
                        <div className="flex flex-1 flex-col p-5">
                          <time
                            className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-gcs-muted-text"
                            dateTime={e.startDate.toISOString()}
                          >
                            {formatEventDates(e.startDate, e.endDate)}
                          </time>
                          <h3 className="mt-2 text-base font-semibold leading-snug text-gcs-foreground">{e.title}</h3>
                          <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gcs-primary group-hover:text-gcs-primary-hover">
                            Read more
                            <ArrowUpRight className="h-4 w-4" />
                          </span>
                        </div>
                      </Link>
                    </article>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </main>
    </>
  );
}
