"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Mail, Linkedin, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PublicHeroSlide } from "@/lib/fetch-public-hero";
import { FALLBACK_HERO_SLIDES, type HeroCarouselSlide } from "@/lib/hero-carousel-data";
import { mapPublicHeroToCarousel } from "@/lib/map-public-hero";
import { MEMBER_LOGIN_PATH } from "@/lib/member-login";

const CAROUSEL_INTERVAL_MS = 7000;

export type HeroProps = {
  /** From `GET /api/public/hero`. When empty or omitted, built-in marketing slides are used. */
  cmsSlides?: PublicHeroSlide[];
};

export function Hero({ cmsSlides }: HeroProps) {
  const slides = useMemo<HeroCarouselSlide[]>(() => {
    if (cmsSlides && cmsSlides.length > 0) {
      return mapPublicHeroToCarousel(cmsSlides);
    }
    return FALLBACK_HERO_SLIDES;
  }, [cmsSlides]);

  const [socialOpen, setSocialOpen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const slideCount = slides.length;

  const activeSlide = useMemo(() => slides[slideIndex], [slides, slideIndex]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSlideIndex((i) => (i + 1) % slideCount);
    }, CAROUSEL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [slideCount]);

  return (
    <section
      className="relative flex min-h-screen w-full flex-col justify-center overflow-hidden pb-20 pt-32 sm:pt-36"
      data-aos="fade-up"
      data-aos-duration="900"
    >
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="absolute inset-0"
          >
            {activeSlide.variant === "photo" ? (
              <Image
                src={activeSlide.imageSrc}
                alt={activeSlide.imageAlt}
                fill
                className="object-cover object-center"
                priority={slideIndex === 0}
                sizes="100vw"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-gcs-primary/40">
                <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-10">
                  <div className="relative aspect-square w-[min(88vw,18.5rem)] rounded-full bg-white/95 shadow-2xl ring-2 ring-white/35 sm:w-[min(80vw,22rem)] md:w-[min(72vw,26rem)]">
                    <div className="absolute inset-[9%] sm:inset-[10%]">
                      <div className="relative h-full w-full">
                        <Image
                          src={activeSlide.imageSrc}
                          alt={activeSlide.imageAlt}
                          fill
                          className="object-contain object-center"
                          sizes="(max-width: 768px) 88vw, 26rem"
                          priority
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {activeSlide.variant === "photo" && (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-950/45 to-slate-950/80" />
            <div className="absolute inset-0 bg-gradient-to-r from-gcs-primary/25 via-transparent to-gcs-secondary/20" />
          </>
        )}
        {activeSlide.variant === "logo" && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/35 to-slate-950/80" />
        )}
      </div>

      <div className="relative z-10 mx-auto flex h-full w-full max-w-[1440px] flex-col items-center px-4 pt-10 text-center sm:px-8 md:pt-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="flex max-w-5xl flex-col items-center"
          >
            {activeSlide.eyebrow ? (
              <p className="mb-4 max-w-2xl text-xs font-semibold uppercase tracking-[0.35em] text-white/90 sm:text-sm">
                {activeSlide.eyebrow}
              </p>
            ) : null}

            {activeSlide.title ? (
              <h1 className="mb-6 max-w-5xl break-words text-3xl font-medium leading-[1.08] tracking-tight text-white drop-shadow-sm sm:text-4xl md:text-6xl lg:text-7xl">
                {activeSlide.title}
              </h1>
            ) : null}

            <p className="mb-8 max-w-2xl px-2 text-base font-light leading-relaxed text-white/95 drop-shadow-sm sm:text-lg md:mb-12 md:text-xl">
              {activeSlide.description}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="relative z-30 mb-8 flex flex-wrap items-center justify-center gap-3 md:mb-10">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSlideIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === slideIndex ? "w-8 bg-white" : "w-2 bg-white/40  hover:bg-white/70"
              }`}
              aria-label={`Show slide ${i + 1}${s.title ? `: ${s.title}` : ""}`}
              aria-current={i === slideIndex}
            />
          ))}
        </div>

        {activeSlide.ctaLabel ? (
          <div className="relative z-30 mb-16 md:mb-12">
            <Link
              href={activeSlide.ctaHref || MEMBER_LOGIN_PATH}
              className="group inline-flex animate-float items-center gap-3 rounded-full bg-white p-1.5 pl-6 pr-1.5 shadow-[0_20px_40px_-5px_rgba(15,23,42,0.45)] transition-transform hover:scale-[1.01] md:gap-4 md:p-2 md:pl-8 md:pr-2"
            >
              <span className="text-lg font-semibold tracking-tight text-slate-900 md:text-xl">
                {activeSlide.ctaLabel}
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gcs-primary text-white transition-transform group-hover:rotate-45 group-hover:bg-gcs-primary-hover md:h-12 md:w-12">
                <ArrowUpRight className="h-5 w-5 md:h-6 md:w-6" />
              </span>
            </Link>
          </div>
        ) : (
          <div className="mb-16 md:mb-12" aria-hidden />
        )}

        <div className="absolute bottom-20 right-4 z-20 flex max-w-[min(100%,14rem)] flex-col items-end sm:bottom-6 sm:right-6 md:bottom-12 md:right-12 md:max-w-none">
          <AnimatePresence mode="wait">
            {!socialOpen ? (
              <motion.button
                key="social-btn"
                layoutId="connect-widget"
                type="button"
                onClick={() => setSocialOpen(true)}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-xl transition-transform hover:scale-105"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Open contact options"
              >
                <Mail className="h-6 w-6 text-gcs-primary" />
              </motion.button>
            ) : (
              <motion.div
                key="social-list"
                layoutId="connect-widget"
                className="flex flex-col items-end gap-3 bg-transparent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <motion.button
                  type="button"
                  onClick={() => setSocialOpen(false)}
                  className="mb-1 rounded-full bg-white p-2 shadow-md transition-colors hover:bg-neutral-50"
                  whileHover={{ rotate: 90 }}
                >
                  <X className="h-4 w-4 text-gcs-foreground" />
                </motion.button>

                <motion.a
                  href="mailto:secretariat@ghanachemicalsociety.org"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0 }}
                  className="flex w-full min-w-0 max-w-[min(100vw-2rem,14rem)] items-center justify-center gap-2 rounded-full border border-white/30 bg-white/95 px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-gcs-foreground shadow-lg backdrop-blur-md transition-transform hover:scale-[1.02] sm:min-w-[200px] sm:max-w-none sm:px-6 sm:py-3 sm:text-sm"
                >
                  <Mail className="h-4 w-4 shrink-0 text-gcs-primary" />
                  Email the secretariat
                </motion.a>

                <motion.a
                  href="https://www.linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 }}
                  className="flex w-full min-w-0 max-w-[min(100vw-2rem,14rem)] items-center justify-center gap-2 rounded-full border border-white/30 bg-white/95 px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-gcs-foreground shadow-lg backdrop-blur-md transition-transform hover:scale-[1.02] sm:min-w-[200px] sm:max-w-none sm:px-6 sm:py-3 sm:text-sm"
                >
                  <Linkedin className="h-4 w-4 shrink-0 text-gcs-primary" />
                  Follow on LinkedIn
                </motion.a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
