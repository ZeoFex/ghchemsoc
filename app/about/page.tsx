import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { ContactFooter } from "@/components/home/contact-footer";
import { AboutExecutivesTeaser } from "@/components/about/about-executives-teaser";
import { AboutHeroHeadline } from "@/components/about/about-hero-headline";
import { AboutSections } from "@/components/about/about-sections";
import { getHomepageExploreForPublic, getPublishedAboutSections, getPublishedExecutives } from "@/lib/cms-queries";
import type { HomepageExplorePublic } from "@/lib/homepage-explore";
import { normalizeHeadlineSpacing } from "@/lib/headline-spacing";
import { ArrowDown, ArrowUpRight, BookOpen, MapPin, Users } from "lucide-react";

export const metadata: Metadata = buildMetadata({
  title: "About",
  description:
    "Learn about the Ghana Chemical Society (ghchemsoc, GCS)—our mission, programmes, leadership, and values advancing chemistry in Ghana.",
  path: "/about",
});

function MissionIntro({ mission }: { mission: HomepageExplorePublic }) {
  const headlineLine1 = normalizeHeadlineSpacing(mission.headlineLine1);
  const headlineLine2 = normalizeHeadlineSpacing(mission.headlineLine2);

  return (
    <section
      className="relative border-b border-gcs-border/60 bg-gradient-to-b from-blue-50/50 via-white to-white"
      data-aos="fade-up"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_20%_0%,rgba(29,78,216,0.08),transparent_55%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-[1100px] px-4 py-12 sm:px-6 md:px-10 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:items-start lg:gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gcs-primary">
              {mission.missionEyebrow}
            </p>
            <h2 className="gcs-section-title mt-4 max-w-3xl">
              {headlineLine1}
              {headlineLine2 ? (
                <>
                  {" "}
                  <span className="text-gcs-primary">{headlineLine2}</span>
                </>
              ) : null}
            </h2>
            {mission.aboutBody ? (
              <p className="gcs-lead mt-6 max-w-3xl text-gcs-muted-text">{mission.aboutBody}</p>
            ) : null}
            {mission.bottomBlurb ? (
              <p className="mt-5 max-w-3xl border-l-4 border-gcs-primary/30 pl-5 text-sm leading-relaxed text-gcs-muted-text sm:text-base">
                {mission.bottomBlurb}
              </p>
            ) : null}
          </div>

          <aside className="rounded-3xl border border-blue-100/80 bg-white/90 p-6 shadow-[0_14px_40px_-18px_rgba(29,78,216,0.18)] ring-1 ring-blue-50 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">On this page</p>
            <nav className="mt-4 space-y-2.5" aria-label="About page sections">
              <a
                href="#about-sections"
                className="group flex items-center justify-between rounded-2xl border border-gcs-border/70 bg-neutral-50/80 px-4 py-3 text-sm font-semibold text-gcs-foreground transition hover:border-gcs-primary/30 hover:bg-white"
              >
                Society overview
                <ArrowDown className="h-4 w-4 text-gcs-primary transition-transform group-hover:translate-y-0.5" aria-hidden />
              </a>
              <Link
                href="/executives"
                className="group flex items-center justify-between rounded-2xl border border-blue-200/70 bg-blue-50/60 px-4 py-3 text-sm font-semibold text-gcs-foreground transition hover:bg-blue-50"
              >
                Leadership
                <Users className="h-4 w-4 text-gcs-primary" aria-hidden />
              </Link>
              <Link
                href="/publications"
                className="group flex items-center justify-between rounded-2xl border border-gcs-border/70 bg-white px-4 py-3 text-sm font-semibold text-gcs-foreground transition hover:border-gcs-primary/30"
              >
                Publications
                <BookOpen className="h-4 w-4 text-gcs-primary" aria-hidden />
              </Link>
              <Link
                href="/membership"
                className="group flex items-center justify-between rounded-2xl bg-gcs-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-gcs-primary-hover"
              >
                Join GCS
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            </nav>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default async function AboutPage() {
  const [sections, mission, executives] = await Promise.all([
    getPublishedAboutSections(),
    getHomepageExploreForPublic(),
    getPublishedExecutives(),
  ]);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />
      <Header />
      <main className="relative min-h-screen overflow-x-hidden bg-white text-gcs-foreground">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-white" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_0%,rgba(29,78,216,0.28),transparent_60%)]" />
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0">
            <Image
              src={mission.mainImageUrl}
              alt={mission.mainImageAlt}
              fill
              className="object-cover object-center opacity-70"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-slate-950/20" />
          </div>

          <div className="relative mx-auto max-w-[1100px] px-4 pb-16 pt-28 sm:px-6 md:px-10 md:pb-24 md:pt-32">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/90 backdrop-blur-md">
                {mission.aboutEyebrow}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur-md">
                <MapPin className="h-3.5 w-3.5 text-blue-200" aria-hidden />
                {mission.locationLabel}
              </div>
            </div>

            <div className="mt-8 max-w-4xl text-white">
              <AboutHeroHeadline line1={mission.headlineLine1} line2={mission.headlineLine2} variant="dark" />
              {mission.aboutBody ? (
                <p className="gcs-lead mt-6 max-w-2xl text-white/80">{mission.aboutBody}</p>
              ) : null}
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href="/membership"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-gcs-primary shadow-lg shadow-black/10 transition hover:bg-blue-50"
              >
                Join GCS
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/executives"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
              >
                Meet leadership
                <Users className="h-4 w-4" aria-hidden />
              </Link>
              <a
                href="#about-sections"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white/90 transition hover:border-white/30 hover:bg-white/5"
              >
                Explore sections
                <ArrowDown className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </div>
        </section>

        <MissionIntro mission={mission} />

        <section
          id="about-sections"
          className="relative mx-auto max-w-[1100px] px-4 py-14 sm:px-6 md:px-10 md:py-20"
        >
          <header className="mb-10 max-w-2xl md:mb-14" data-aos="fade-up">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gcs-muted-text">Our story</p>
            <h2 className="gcs-section-title mt-3">Who we are and what we stand for</h2>
            <p className="gcs-lead mt-4 text-gcs-muted-text">
              Learn about the society&apos;s mission, programmes, and the values that guide our work across Ghana&apos;s
              chemical sciences community.
            </p>
          </header>

          <AboutSections sections={sections} />
          <AboutExecutivesTeaser executives={executives} />
        </section>

        <section className="border-t border-gcs-border/50 px-4 py-12 sm:px-6 md:px-10">
          <div
            className="mx-auto flex max-w-[1100px] flex-col items-center justify-between gap-6 overflow-hidden rounded-2xl bg-gradient-to-r from-gcs-primary to-blue-700 px-6 py-10 shadow-[0_20px_50px_-20px_rgba(29,78,216,0.45)] sm:flex-row sm:rounded-3xl sm:px-10"
            data-aos="fade-up"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">Membership</p>
              <p className="mt-2 text-center text-lg font-semibold text-white sm:text-left sm:text-xl">
                Ready to join Ghana&apos;s chemistry community?
              </p>
            </div>
            <Link
              href="/membership"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-gcs-primary shadow-sm transition hover:bg-blue-50"
            >
              Become a member
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <ContactFooter />
      </main>
    </>
  );
}
