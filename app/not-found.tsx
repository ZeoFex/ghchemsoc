"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

function Molecule({
  className,
  stroke = "rgba(29, 78, 216, 0.55)",
  fill = "rgba(255,255,255,0.65)",
}: {
  className?: string;
  stroke?: string;
  fill?: string;
}) {
  return (
    <svg viewBox="0 0 220 220" className={className} fill="none" aria-hidden>
      <path
        d="M66 128 L110 78 L156 108 L136 162 L90 164 Z"
        stroke={stroke}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="66" cy="128" r="14" fill={fill} stroke={stroke} strokeWidth="3" />
      <circle cx="110" cy="78" r="14" fill={fill} stroke={stroke} strokeWidth="3" />
      <circle cx="156" cy="108" r="14" fill={fill} stroke={stroke} strokeWidth="3" />
      <circle cx="136" cy="162" r="14" fill={fill} stroke={stroke} strokeWidth="3" />
      <circle cx="90" cy="164" r="14" fill={fill} stroke={stroke} strokeWidth="3" />
    </svg>
  );
}

function Equation({ children, className }: { children: string; className: string }) {
  return (
    <div
      className={[
        "pointer-events-none select-none font-mono text-[0.85rem] leading-relaxed text-slate-900/35",
        "drop-shadow-[0_1px_0_rgba(255,255,255,0.65)]",
        className,
      ].join(" ")}
      aria-hidden
    >
      {children}
    </div>
  );
}

export default function NotFound() {
  const reduceMotion = useReducedMotion();

  return (
    <main className="relative min-h-screen overflow-hidden bg-white px-4 py-24 text-gcs-foreground sm:px-6 md:px-10">
      {/* Chemistry backdrop */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,rgba(29,78,216,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_20%_90%,rgba(14,165,233,0.10),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_85%_80%,rgba(59,130,246,0.08),transparent_55%)]" />

        <Equation className="absolute left-6 top-10 rotate-[-6deg] sm:left-12 sm:top-12">
          {"2H₂ + O₂ → 2H₂O  ·  ΔH < 0"}
        </Equation>
        <Equation className="absolute right-6 top-20 rotate-[7deg] text-right sm:right-16 sm:top-20">
          {"N₂ + 3H₂ ⇌ 2NH₃  ·  Fe catalyst"}
        </Equation>
        <Equation className="absolute left-8 bottom-20 rotate-[4deg] sm:left-16 sm:bottom-24">
          {"CH₄ + 2O₂ → CO₂ + 2H₂O"}
        </Equation>
        <Equation className="absolute right-8 bottom-10 rotate-[-4deg] text-right sm:right-20 sm:bottom-12">
          {"C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂"}
        </Equation>

        <motion.div
          className="absolute -left-14 top-28 h-56 w-56 opacity-70 sm:h-64 sm:w-64"
          initial={{ y: 0, rotate: -10 }}
          animate={
            reduceMotion
              ? { y: 0, rotate: -10 }
              : { y: [0, 14, 0], rotate: [-10, -4, -10] }
          }
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <Molecule className="h-full w-full" />
        </motion.div>

        <motion.div
          className="absolute -right-16 top-36 h-60 w-60 opacity-70 sm:top-32 sm:h-72 sm:w-72"
          initial={{ y: 0, rotate: 12 }}
          animate={
            reduceMotion
              ? { y: 0, rotate: 12 }
              : { y: [0, -16, 0], rotate: [12, 6, 12] }
          }
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        >
          <Molecule className="h-full w-full" stroke="rgba(14,165,233,0.55)" fill="rgba(255,255,255,0.7)" />
        </motion.div>

        <motion.div
          className="absolute left-1/2 top-[58%] h-44 w-44 -translate-x-1/2 opacity-55 sm:h-52 sm:w-52"
          initial={{ y: 0, rotate: 0 }}
          animate={reduceMotion ? { y: 0, rotate: 0 } : { y: [0, 10, 0], rotate: [0, 6, 0] }}
          transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Molecule className="h-full w-full" stroke="rgba(30,64,175,0.55)" fill="rgba(255,255,255,0.55)" />
        </motion.div>
      </div>

      <div className="relative mx-auto max-w-xl text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-gcs-border bg-white/90 shadow-sm backdrop-blur">
          <div className="relative h-14 w-14">
            <Image
              src="/logo/ghana-chemical-society-logo.png"
              alt="Ghana Chemical Society logo"
              fill
              className="object-contain object-center"
              sizes="56px"
              priority
            />
          </div>
        </div>

        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-gcs-muted-text">Error 404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gcs-foreground sm:text-4xl">
          Page not found
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-gcs-muted-text sm:text-base">
          That route didn’t react. Let’s rebalance the mixture and get you back to safety.
        </p>

        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-gcs-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gcs-primary-hover"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}

