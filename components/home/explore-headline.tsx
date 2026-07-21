"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { normalizeHeadlineSpacing } from "@/lib/headline-spacing";

const CHAR_DELAY = 0.065;
const CHAR_DURATION = 0.45;
const LINE_GAP = 0.45;

function splitChars(text: string) {
  return [...text];
}

type Props = {
  line1: string;
  line2: string;
  className?: string;
  line1ClassName?: string;
  line2ClassName?: string;
};

export function ExploreHeadline({ line1, line2, className, line1ClassName, line2ClassName }: Props) {
  const reduceMotion = useReducedMotion();
  const normalized1 = useMemo(() => normalizeHeadlineSpacing(line1), [line1]);
  const normalized2 = useMemo(() => normalizeHeadlineSpacing(line2), [line2]);
  const chars1 = useMemo(() => splitChars(normalized1), [normalized1]);
  const chars2 = useMemo(() => splitChars(normalized2), [normalized2]);
  const line2Start = reduceMotion ? 0 : chars1.length * CHAR_DELAY + LINE_GAP;

  const headingClass =
    className ??
    "mx-auto max-w-full break-words text-3xl font-medium leading-[1.1] tracking-tight sm:text-4xl md:text-5xl lg:max-w-4xl lg:text-[2.75rem] lg:leading-[1.08]";

  if (reduceMotion) {
    return (
      <h2 className={headingClass}>
        {normalized1 ? <span className={line1ClassName ?? "block"}>{normalized1}</span> : null}
        {normalized2 ? <span className={line2ClassName ?? "block"}>{normalized2}</span> : null}
      </h2>
    );
  }

  return (
    <h2 className={headingClass}>
      <span className={line1ClassName ?? "block"}>
        {chars1.map((char, i) => (
          <motion.span
            key={`l1-${i}-${char === " " ? "space" : char}`}
            className={char === " " ? "inline-block w-[0.28em]" : "inline-block"}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{
              duration: CHAR_DURATION,
              delay: i * CHAR_DELAY,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </span>
      {normalized2 ? (
        <span className={line2ClassName ?? "block"}>
          {chars2.map((char, i) => (
            <motion.span
              key={`l2-${i}-${char === " " ? "space" : char}`}
              className={char === " " ? "inline-block w-[0.28em]" : "inline-block"}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{
                duration: CHAR_DURATION,
                delay: line2Start + i * CHAR_DELAY,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </span>
      ) : null}
    </h2>
  );
}
