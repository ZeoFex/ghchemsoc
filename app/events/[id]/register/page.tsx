import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { buildMetadata } from "@/lib/seo";
import { EventRegistrationForm } from "@/components/events/event-registration-form";
import { getPublishedSocietyEventById } from "@/lib/cms-queries";
import { formatEventDates } from "@/lib/event-format";
import { hasRegistrationForm, parseRegistrationFormFields } from "@/lib/event-registration-form";
import { ArrowLeft, Calendar, Clock, MapPin, Sparkles } from "lucide-react";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params;
  const event = await getPublishedSocietyEventById(id);
  if (!event) {
    return buildMetadata({ title: "Event registration", path: `/events/${id}/register`, noIndex: true });
  }
  return buildMetadata({
    title: `Register · ${event.title}`,
    description: `Register for ${event.title}.`,
    path: `/events/${id}/register`,
    noIndex: true,
    absoluteTitle: true,
  });
}

export default async function EventRegisterPage(props: PageProps) {
  const { id } = await props.params;
  const event = await getPublishedSocietyEventById(id);
  if (!event) notFound();

  const fields = parseRegistrationFormFields(event.registrationFormFields);
  if (!hasRegistrationForm(event.registrationFormFields)) {
    redirect(`/events/${id}`);
  }

  return (
    <>
      <Header />
      <main className="relative min-h-screen overflow-hidden bg-white pb-20 pt-28 md:pb-28 md:pt-32">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-white via-white to-sky-50/25"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04] [background-image:radial-gradient(circle_at_1px_1px,#1e40af_1px,transparent_0)] [background-size:28px_28px]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6 md:px-10">
          <nav className="flex flex-wrap items-center gap-2 text-sm text-gcs-muted-text" aria-label="Breadcrumb">
            <Link
              href={`/events/${id}`}
              className="inline-flex items-center gap-1.5 font-medium text-gcs-primary transition-colors hover:text-gcs-primary-hover"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to event
            </Link>
          </nav>

          <header className="mx-auto mt-8 max-w-3xl text-center lg:mx-0 lg:max-w-none lg:text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gcs-border bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gcs-muted-text shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-gcs-primary" aria-hidden />
              Event registration
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-gcs-foreground md:text-4xl lg:text-[2.35rem] lg:leading-[1.12]">
              Register for {event.title}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gcs-muted-text lg:mx-0">
              Complete the form below. Fields are set by the event organisers and your answers are sent to the GCS team.
            </p>
          </header>

          <div className="mx-auto mt-12 max-w-3xl lg:mt-14 lg:grid lg:max-w-none lg:grid-cols-12 lg:gap-x-10 xl:gap-x-14">
            <div className="lg:col-span-7 xl:col-span-8">
              <div className="overflow-hidden rounded-2xl border border-gcs-border/80 bg-white shadow-sm ring-1 ring-gcs-border/15">
                <div className="border-b border-gcs-border/60 bg-gradient-to-br from-gcs-primary/[0.06] via-white to-white px-6 py-5 md:px-8">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-gcs-primary">Your details</p>
                  <p className="mt-2 text-sm text-gcs-muted-text">Required fields are marked with an asterisk.</p>
                </div>
                <div className="px-6 py-8 md:px-8 md:py-9">
                  <EventRegistrationForm eventId={event.id} fields={fields} />
                </div>
              </div>
            </div>

            <aside className="mt-10 lg:col-span-5 lg:mt-0 xl:col-span-4">
              <div className="lg:sticky lg:top-32">
                <div className="overflow-hidden rounded-2xl border border-gcs-border/80 bg-white shadow-sm ring-1 ring-gcs-border/15">
                  {event.media?.url ? (
                    <div className="relative aspect-[16/10] w-full border-b border-gcs-border/50 bg-neutral-50">
                      <Image
                        src={event.media.url}
                        alt={event.media.alt ?? event.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 400px"
                      />
                    </div>
                  ) : null}
                  <div className="p-6 md:p-7">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gcs-muted-text">Event</p>
                    <h2 className="mt-2 text-lg font-semibold leading-snug text-gcs-foreground">{event.title}</h2>
                    <ul className="mt-6 space-y-4 text-sm">
                      <li className="flex gap-3">
                        <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-gcs-primary" aria-hidden />
                        <span className="text-gcs-muted-text">
                          <time dateTime={event.startDate.toISOString()}>
                            {formatEventDates(event.startDate, event.endDate)}
                          </time>
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gcs-primary" aria-hidden />
                        <span className="text-gcs-muted-text">{event.timeLabel}</span>
                      </li>
                      <li className="flex gap-3">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gcs-primary" aria-hidden />
                        <span className="text-gcs-muted-text">{event.location}</span>
                      </li>
                    </ul>
                    <Link
                      href={`/events/${id}`}
                      className="mt-6 inline-flex text-sm font-semibold text-gcs-primary hover:text-gcs-primary-hover hover:underline"
                    >
                      View full event page
                    </Link>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
