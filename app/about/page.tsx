import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { ContactFooter } from "@/components/home/contact-footer";
import { AboutExecutivesTeaser } from "@/components/about/about-executives-teaser";
import { AboutSections } from "@/components/about/about-sections";
import { getHomepageExploreForPublic, getPublishedAboutSections, getPublishedExecutives } from "@/lib/cms-queries";
import type { HomepageExplorePublic } from "@/lib/homepage-explore";
import { ArrowDown, ArrowUpRight, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "About | Ghana Chemical Society",
  description: "Mission, programmes, and values of the Ghana Chemical Society.",
};

function MissionIntro({ mission }: { mission: HomepageExplorePublic }) {
  return (
    <div
      className="border-b border-gcs-border/60 bg-gradient-to-b from-blue-50/60 via-white to-white"
      data-aos="fade-up"
    >
      <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6 md:px-10 md:py-14">
        <div className="grid gap-6 md:grid-cols-[1fr_360px] md:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gcs-primary">
              {mission.missionEyebrow}
            </p>
            <h2 className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight text-gcs-foreground sm:text-3xl">
              {mission.headlineLine1}{" "}
              <span className="text-gcs-primary">{mission.headlineLine2}</span>
            </h2>
            {mission.aboutBody ? (
              <p className="gcs-lead mt-5 max-w-3xl text-gcs-muted-text">{mission.aboutBody}</p>
            ) : null}
            {mission.bottomBlurb ? (
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gcs-muted-text sm:text-base">
                {mission.bottomBlurb}
              </p>
            ) : null}
          </div>

          <aside className="rounded-3xl border border-blue-100/80 bg-white p-6 shadow-[0_14px_40px_-18px_rgba(29,78,216,0.20)] ring-1 ring-blue-50">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Quick links</p>
            <div className="mt-4 space-y-3">
              <a
                href="#about-sections"
                className="group flex items-center justify-between rounded-2xl border border-gcs-border/70 bg-neutral-50/80 px-4 py-3 text-sm font-semibold text-gcs-foreground transition hover:bg-white"
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
                href="/membership"
                className="group flex items-center justify-between rounded-2xl bg-gcs-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-gcs-primary-hover"
              >
                Join GCS
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
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
      <Header />
      <main className="min-h-screen bg-white text-gcs-foreground">
        {/* Hero: single background image (no headline card) */}
        <section className="relative overflow-hidden border-b border-blue-100/70 bg-slate-950">
          <Image
            src={mission.mainImageUrl}
            alt={mission.mainImageAlt}
            fill
            className="object-cover object-center"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-slate-950/10" />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_0%,rgba(29,78,216,0.22),transparent_60%)]"
            aria-hidden
          />

          <div className="relative mx-auto max-w-[1100px] px-4 pb-14 pt-28 sm:px-6 md:px-10 md:pb-20 md:pt-32">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/85 backdrop-blur-md">
                {mission.aboutEyebrow}
              </div>
              <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur-md">
                {mission.locationLabel}
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href="/membership"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-gcs-primary shadow-sm"
              >
                Join GCS
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/executives"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
              >
                Meet leadership
                <Users className="h-4 w-4" aria-hidden />
              </Link>
              <a
                href="#about-sections"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-transparent px-6 py-3 text-sm font-semibold text-white/90 transition hover:border-white/25 hover:bg-white/5"
              >
                Learn more
                <ArrowDown className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </div>
        </section>

        <MissionIntro mission={mission} />

        {/* CMS sections: mission, core values, etc. */}
        <section id="about-sections" className="mx-auto max-w-[1100px] px-4 py-12 sm:px-6 md:px-10 md:py-16">
          <AboutSections sections={sections} />
          <AboutExecutivesTeaser executives={executives} />
        </section>

        <section className="border-t border-gcs-border/50 px-4 py-12 sm:px-6 md:px-10">
          <div className="mx-auto flex max-w-[1100px] flex-col items-center justify-between gap-6 rounded-2xl bg-gcs-primary px-6 py-8 sm:flex-row sm:rounded-3xl sm:px-10">
            <p className="text-center text-lg font-semibold text-white sm:text-left sm:text-xl">
              Ready to join Ghana&apos;s chemistry community?
            </p>
            <Link
              href="/membership"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-gcs-primary"
            >
              Membership
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <ContactFooter />
      </main>
    </>
  );
}
