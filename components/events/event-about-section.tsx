"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, BookOpen } from "lucide-react";
import { EventAboutBody } from "@/components/events/event-about-body";
import { looksLikeRichHtml } from "@/lib/news-content";
import { cn } from "@/lib/utils";

type Props = {
  body: string | null;
  excerpt: string;
  /** Start expanded (default true). Long bodies still collapse cleanly. */
  defaultOpen?: boolean;
};

function plainPreview(body: string | null, excerpt: string): string {
  const raw = (body?.trim() || excerpt || "").trim();
  if (!raw) return "";
  const text = looksLikeRichHtml(raw)
    ? raw
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
    : raw.replace(/\s+/g, " ").trim();
  if (text.length <= 160) return text;
  return `${text.slice(0, 157).trimEnd()}…`;
}

export function EventAboutSection({ body, excerpt, defaultOpen = true }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const preview = plainPreview(body, excerpt);
  const hasContent = Boolean((body?.trim() || excerpt?.trim()));

  if (!hasContent) return null;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[1.35rem] border border-gcs-border/50 bg-gradient-to-br from-white via-white to-sky-50/40 shadow-sm ring-1 ring-gcs-border/15",
        "transition-shadow duration-300",
        open ? "shadow-md" : "hover:shadow-md"
      )}
      aria-labelledby={`${panelId}-heading`}
    >
      <button
        type="button"
        id={`${panelId}-heading`}
        className="group flex w-full items-start gap-4 px-6 py-5 text-left md:items-center md:px-8 md:py-6"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span
          className={cn(
            "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors",
            open ? "bg-gcs-primary text-white" : "bg-gcs-primary/10 text-gcs-primary group-hover:bg-gcs-primary/15"
          )}
          aria-hidden
        >
          <BookOpen className="h-5 w-5" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-gcs-muted-text">
            About this event
          </span>
          <span className="mt-1.5 block text-base font-semibold tracking-tight text-gcs-foreground md:text-lg">
            {open ? "Event details" : "Read the full description"}
          </span>
          {!open && preview ? (
            <span className="mt-2 block text-sm leading-relaxed text-gcs-muted-text line-clamp-2">
              {preview}
            </span>
          ) : null}
        </span>

        <span
          className={cn(
            "mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gcs-border/70 bg-white text-gcs-foreground transition-transform duration-300 md:mt-0",
            open && "rotate-180 bg-gcs-primary/5 border-gcs-primary/20 text-gcs-primary"
          )}
          aria-hidden
        >
          <ChevronDown className="h-4 w-4" />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panelId}
            key="about-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-gcs-border/40 px-6 pb-8 pt-2 md:px-9 md:pb-10">
              <div className="relative">
                <div
                  className="pointer-events-none absolute -left-2 top-4 hidden h-[calc(100%-1rem)] w-px bg-gradient-to-b from-gcs-primary/40 via-gcs-primary/15 to-transparent sm:block"
                  aria-hidden
                />
                <EventAboutBody body={body} excerpt={excerpt} />
              </div>

              <div className="mt-8 flex justify-center border-t border-gcs-border/30 pt-5">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-gcs-border/70 bg-white px-4 py-2 text-sm font-medium text-gcs-muted-text transition-colors hover:border-gcs-primary/30 hover:text-gcs-primary"
                  onClick={() => setOpen(false)}
                >
                  Show less
                  <ChevronDown className="h-4 w-4 rotate-180" aria-hidden />
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
