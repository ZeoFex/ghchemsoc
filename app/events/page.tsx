import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { getPublishedSocietyEvents } from "@/lib/cms-queries";
import { formatEventDates } from "@/lib/event-format";
import { eventRegisterPath, showRegisterHereOnListing } from "@/lib/event-listing-cta";
import { ArrowUpRight, Calendar, Clock, MapPin, Sparkles } from "lucide-react";

export const metadata: Metadata = buildMetadata({
  title: "Conferences & events",
  description:
    "GCS symposia, workshops, and member gatherings—dates, venues, and how to take part.",
  path: "/events",
});

export default async function EventsPage() {
  const rows = await getPublishedSocietyEvents();
  const featured = rows.find((r) => r.featured) ?? rows[0] ?? null;
  const others = featured ? rows.filter((r) => r.id !== featured.id) : [];

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Events", path: "/events" },
        ])}
      />
      <Header />
      <main className="relative min-h-screen pb-24 pt-24 md:pb-32 md:pt-28">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-gradient-to-b from-white via-white to-neutral-50/40">
          <div className="absolute -top-32 left-1/2 h-[min(560px,95vw)] w-[min(560px,95vw)] -translate-x-1/2 rounded-full bg-gradient-to-br from-gcs-primary/12 via-sky-200/25 to-transparent blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[380px] w-[380px] translate-x-1/4 rounded-full bg-gcs-secondary/10 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.035] [background-image:radial-gradient(circle_at_1px_1px,#1e40af_1px,transparent_0)] [background-size:24px_24px]"
            aria-hidden
          />
        </div>

        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 md:px-12">
          <header
            className="flex flex-col gap-10 border-b border-gcs-border/80 pb-12 md:flex-row md:items-end md:justify-between md:pb-14"
            data-aos="fade-up"
            data-aos-duration="700"
          >
            <div className="max-w-2xl md:max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gcs-border/90 bg-gcs-surface/90 px-4 py-1.5 text-sm font-medium text-gcs-muted-text shadow-sm backdrop-blur-sm">
                <Calendar className="h-3.5 w-3.5 text-gcs-primary" aria-hidden />
                Conferences &amp; events
              </div>
              <h1 className="gcs-page-title">
                Where Ghana&rsquo;s chemistry community meets
              </h1>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/membership"
                className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gcs-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-gcs-primary-hover"
              >
                Member benefits
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link
                href="/contact"
                className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-gcs-border bg-gcs-surface/90 px-6 py-3 text-sm font-semibold text-gcs-foreground shadow-sm transition-colors hover:border-gcs-primary hover:text-gcs-primary"
              >
                Host with GCS
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </header>

          {!rows.length ? (
            <div
              className="mt-16 rounded-[1.75rem] border border-dashed border-gcs-border bg-gcs-surface/90 px-8 py-16 text-center shadow-sm"
              data-aos="fade-up"
              data-aos-delay="80"
            >
              <p className="text-lg font-semibold text-gcs-foreground">No published events yet</p>
              <p className="mt-2 text-sm text-gcs-muted-text">
                New conferences and meetings will be listed here as they are announced.
              </p>
            </div>
          ) : null}

          {featured ? (
            <section className="mt-14 lg:mt-16" aria-labelledby="featured-heading" data-aos="fade-up" data-aos-delay="60" data-aos-duration="750">
              <div className="mb-6 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-gcs-primary" aria-hidden />
                <h2 id="featured-heading" className="text-sm font-semibold uppercase tracking-[0.2em] text-gcs-muted-text">
                  Spotlight
                </h2>
              </div>
              <article className="overflow-hidden rounded-[1.85rem] border border-gcs-border/55 bg-gcs-surface shadow-[0_22px_60px_-28px_rgba(15,23,42,0.18)] ring-1 ring-gcs-border/25 lg:rounded-[2rem]">
                <div className="flex flex-col lg:min-h-[320px] lg:flex-row">
                  {featured.media?.url ? (
                    <div className="relative aspect-[16/10] w-full shrink-0 lg:aspect-auto lg:w-[48%] lg:min-h-[320px]">
                      <Image
                        src={featured.media.url}
                        alt={featured.media.alt ?? featured.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 46vw"
                        priority
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent lg:bg-gradient-to-r" />
                    </div>
                  ) : null}
                  <div
                    className={`flex flex-1 flex-col justify-center border-t border-gcs-border/60 bg-white px-6 py-9 md:px-11 md:py-10 lg:border-t-0 ${
                      featured.media?.url ? "lg:border-l lg:border-gcs-border/50" : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-gcs-muted-text">
                      {featured.badge ? (
                        <>
                          <span className="rounded-full border border-gcs-border/70 bg-neutral-50 px-3 py-1 text-gcs-primary">
                            {featured.badge}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-gcs-border" aria-hidden />
                        </>
                      ) : null}
                      <time dateTime={featured.startDate.toISOString()}>
                        {formatEventDates(featured.startDate, featured.endDate)}
                      </time>
                    </div>
                    <h3 className="mt-4 text-2xl font-semibold tracking-tight text-gcs-foreground md:text-[1.7rem] md:leading-snug">
                      {featured.title}
                    </h3>
                    <p className="mt-4 max-w-xl text-sm leading-relaxed text-gcs-muted-text md:text-[0.95rem]">
                      {featured.excerpt}
                    </p>
                    <ul className="mt-7 flex flex-col gap-3 text-sm text-gcs-foreground">
                      <li className="flex items-start gap-3">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gcs-primary" aria-hidden />
                        <span>{featured.timeLabel}</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gcs-primary" aria-hidden />
                        <span>{featured.location}</span>
                      </li>
                    </ul>
                    <div className="mt-9 flex flex-wrap gap-3">
                      <Link
                        href={`/events/${featured.id}`}
                        className="group inline-flex items-center gap-2 rounded-full bg-gcs-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gcs-primary-hover"
                      >
                        Read more
                        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </Link>
                      {showRegisterHereOnListing(featured.registrationFormFields) ? (
                        <Link
                          href={eventRegisterPath(featured.id)}
                          className="inline-flex items-center gap-2 rounded-full border border-gcs-border bg-white px-5 py-2.5 text-sm font-semibold text-gcs-foreground shadow-sm transition-colors hover:border-gcs-primary hover:text-gcs-primary"
                        >
                          Register here
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            </section>
          ) : null}

          {others.length ? (
            <section
              className="mt-16 lg:mt-20"
              aria-labelledby="upcoming-heading"
              data-aos="fade-up"
              data-aos-delay="40"
              data-aos-duration="700"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 id="upcoming-heading" className="text-xl font-semibold tracking-tight text-gcs-foreground md:text-2xl">
                    {featured ? "More dates" : "Upcoming"}
                  </h2>
                  <p className="mt-2 max-w-lg text-sm text-gcs-muted-text">
                    Tap an event for the full description. Members receive calendar updates and discounted registration
                    where applicable.
                  </p>
                </div>
              </div>

              <ul className="mt-10 grid list-none gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {others.map((event, idx) => {
                  const img = event.media?.url;
                  return (
                    <li key={event.id} data-aos="fade-up" data-aos-delay={String(50 + idx * 70)} data-aos-duration="650">
                      <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gcs-border/55 bg-gcs-surface shadow-sm ring-1 ring-gcs-border/12 transition-all duration-300 hover:-translate-y-0.5 hover:border-gcs-border hover:shadow-lg">
                        <Link href={`/events/${event.id}`} className="flex flex-1 flex-col">
                          <div className="relative aspect-[16/11] w-full shrink-0 overflow-hidden border-b border-gcs-border/35 bg-neutral-50">
                            {img ? (
                              <Image
                                src={img}
                                alt={event.media?.alt ?? event.title}
                                fill
                                className="object-cover transition duration-500 group-hover:scale-[1.03]"
                                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                              />
                            ) : (
                              <div className="flex h-full min-h-[140px] items-center justify-center text-xs text-gcs-muted-text">
                                No image
                              </div>
                            )}
                            {event.badge ? (
                              <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-gcs-primary shadow-sm backdrop-blur">
                                {event.badge}
                              </span>
                            ) : null}
                          </div>
                          <div className="flex flex-1 flex-col p-5 md:p-6">
                            <div className="flex flex-wrap items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-gcs-muted-text">
                              <time dateTime={event.startDate.toISOString()}>
                                {formatEventDates(event.startDate, event.endDate)}
                              </time>
                              <span className="text-gcs-border">·</span>
                              <span>{event.timeLabel}</span>
                            </div>
                            <h3 className="mt-3 text-lg font-semibold leading-snug tracking-tight text-gcs-foreground">
                              {event.title}
                            </h3>
                            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gcs-muted-text">{event.excerpt}</p>
                            <p className="mt-3 flex items-start gap-2 text-sm text-gcs-muted-text">
                              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gcs-primary" aria-hidden />
                              <span className="line-clamp-2">{event.location}</span>
                            </p>
                          </div>
                        </Link>
                        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-gcs-border/40 px-5 py-4 md:px-6">
                          <Link
                            href={`/events/${event.id}`}
                            className="text-sm font-semibold text-gcs-primary transition-colors hover:text-gcs-primary-hover"
                          >
                            Read more
                          </Link>
                          {showRegisterHereOnListing(event.registrationFormFields) ? (
                            <Link
                              href={eventRegisterPath(event.id)}
                              className="text-sm font-semibold text-gcs-foreground underline decoration-gcs-border decoration-2 underline-offset-4 transition hover:text-gcs-primary"
                            >
                              Register here
                            </Link>
                          ) : null}
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <aside
            className="mt-16 overflow-hidden rounded-[1.5rem] border border-gcs-border/70 bg-white px-6 py-9 shadow-sm ring-1 ring-gcs-border/15 md:mt-20 md:flex md:items-center md:justify-between md:gap-10 md:px-10 md:py-11"
            data-aos="fade-up"
            data-aos-delay="80"
          >
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gcs-muted-text">Partners &amp; institutions</p>
              <p className="mt-3 text-base font-semibold text-gcs-foreground md:text-lg">Co-host or sponsor a GCS programme</p>
              <p className="mt-2 text-sm leading-relaxed text-gcs-muted-text">
                We coordinate technical tracks, student outreach, and publication of proceedings alongside your team.
              </p>
            </div>
            <Link
              href="/contact"
              className="group mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-gcs-primary px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gcs-primary-hover md:mt-0 md:shrink-0"
            >
              Start a conversation
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </aside>
        </div>
      </main>
    </>
  );
}
