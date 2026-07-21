"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { normalizeHeadlineSpacing } from "@/lib/headline-spacing";
import { cn } from "@/lib/utils";

function splitWords(text: string) {
  const normalized = normalizeHeadlineSpacing(text);
  return normalized ? normalized.split(/\s+/).filter(Boolean) : [];
}

type Props = {
  line1: string;
  line2: string;
  /** "dark" for hero overlays on photography; default is for light backgrounds. */
  variant?: "light" | "dark";
};

export function AboutHeroHeadline({ line1, line2, variant = "light" }: Props) {
  const isDark = variant === "dark";
  const line1Class = isDark ? "block text-white" : "block text-slate-700";
  const line2Class = isDark
    ? "mt-2 block bg-gradient-to-r from-blue-200 via-sky-200 to-white bg-clip-text text-transparent"
    : "mt-2 block bg-gradient-to-r from-gcs-primary via-blue-600 to-blue-800 bg-clip-text text-transparent";
  const titleClass = cn(
    "max-w-full",
    isDark
      ? "text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-[2.75rem] md:leading-[1.12]"
      : "gcs-page-title"
  );
  const reduceMotion = useReducedMotion();
  const words = useMemo(() => splitWords(line1), [line1]);
  const line2Text = useMemo(() => normalizeHeadlineSpacing(line2), [line2]);
  const line1Text = useMemo(() => normalizeHeadlineSpacing(line1), [line1]);
  const line1Done = reduceMotion ? 0 : words.length * 0.07 + 0.4;

  if (reduceMotion) {
    return (
      <h1 className={titleClass}>
        {line1Text ? <span className={line1Class}>{line1Text}</span> : null}
        {line2Text ? <span className={line2Class}>{line2Text}</span> : null}
      </h1>
    );
  }

  return (
    <h1 className={titleClass}>
      <span className={`block break-words ${isDark ? "text-white" : ""}`}>
        {words.map((word, i) => (
          <span key={`${i}-${word}`}>
            <motion.span
              className="inline-block"
              initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 0.5,
                delay: i * 0.07,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {word}
            </motion.span>
            {i < words.length - 1 ? " " : null}
          </span>
        ))}
        {words.length > 0 ? (
          <motion.span
            className={`ml-1 inline-block h-[0.85em] w-[3px] translate-y-px rounded-full align-middle ${isDark ? "bg-blue-200" : "bg-gcs-primary"}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{
              duration: 0.9,
              delay: words.length * 0.07 + 0.15,
              times: [0, 0.2, 0.7, 1],
            }}
            aria-hidden
          />
        ) : null}
      </span>
      {line2Text ? (
        <motion.span
          className={line2Class}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.55,
            delay: line1Done,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {line2Text}
        </motion.span>
      ) : null}
    </h1>
  );
}
