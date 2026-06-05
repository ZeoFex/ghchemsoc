"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

function splitWords(text: string) {
  return text.match(/\S+\s*/g) ?? [text];
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
  const titleClass = cn("max-w-full", isDark ? "text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-[2.75rem] md:leading-[1.12]" : "gcs-page-title");
  const reduceMotion = useReducedMotion();
  const words = useMemo(() => splitWords(line1), [line1]);
  const line1Done = reduceMotion ? 0 : words.length * 0.07 + 0.4;

  if (reduceMotion) {
    return (
      <h1 className={titleClass}>
        <span className={line1Class}>{line1}</span>
        <span className={line2Class}>{line2}</span>
      </h1>
    );
  }

  return (
    <h1 className={titleClass}>
      <span className={`block break-words ${isDark ? "text-white" : ""}`}>
        {words.map((word, i) => (
          <motion.span
            key={`${i}-${word}`}
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
        ))}
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
      </span>
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
        {line2}
      </motion.span>
    </h1>
  );
}
