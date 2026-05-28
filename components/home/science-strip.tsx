"use client";

import Link from "next/link";
import { ArrowRight, Award, FlaskConical, Users2 } from "lucide-react";

const ITEMS = [
  {
    title: "Professional community",
    body: "Connect with chemists in academia, industry, and education across Ghana.",
    icon: Users2,
    href: "/membership",
    cta: "Membership",
  },
  {
    title: "Research & standards",
    body: "Promoting rigorous practice, integrity, and collaboration through programmes and events.",
    icon: FlaskConical,
    href: "/events",
    cta: "Upcoming events",
  },
  {
    title: "Recognition & growth",
    body: "Support for early‑career chemists, mentors, and professional development.",
    icon: Award,
    href: "/about",
    cta: "About GCS",
  },
] as const;

export function ScienceStrip() {
  return (
    <section className="border-y border-gcs-border/70 bg-gradient-to-b from-slate-50/70 via-white to-white px-4 py-14 sm:px-6 md:px-12 md:py-16">
      <div className="mx-auto max-w-[1440px]">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gcs-muted-text">GCS in focus</p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-gcs-foreground sm:text-3xl">
            A modern society for chemistry in Ghana
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gcs-muted-text sm:text-base">
            Clear value for members, partners, and the public—without the heavy animations.
          </p>
        </div>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.title} className="h-full">
                <div className="group h-full rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-900/5 transition hover:-translate-y-0.5 hover:border-gcs-primary/25 hover:shadow-md">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gcs-primary/10 text-gcs-primary">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight text-gcs-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gcs-muted-text">{item.body}</p>
                  <Link
                    href={item.href}
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gcs-primary transition-colors hover:text-gcs-primary-hover"
                  >
                    {item.cta}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

