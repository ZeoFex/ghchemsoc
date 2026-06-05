import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type AboutSection = {
  id: string;
  title: string;
  subtitle: string | null;
  body: string;
  layout: string;
  media: { url: string; alt: string | null } | null;
};

const EXECUTIVES_LINK_PATTERN = /executive|leadership|governance|officer|president|board/i;

function sectionLinksToExecutives(s: AboutSection): boolean {
  const text = `${s.title} ${s.subtitle ?? ""} ${s.body}`;
  return EXECUTIVES_LINK_PATTERN.test(text);
}

function SectionBody({ body }: { body: string }) {
  const blocks = body.split("\n\n").filter((b) => b.trim());
  if (!blocks.length) return null;

  return (
    <div className="gcs-body mt-5 space-y-4">
      {blocks.map((block, j) => (
        <p key={j}>{block.trim()}</p>
      ))}
    </div>
  );
}

function ExecutivesLink() {
  return (
    <Link
      href="/executives"
      className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-gcs-primary transition-colors hover:text-gcs-primary-hover"
    >
      View leadership
      <ArrowUpRight className="h-4 w-4" />
    </Link>
  );
}

function SectionImage({ s, className }: { s: AboutSection; className?: string }) {
  if (!s.media) return null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50/90 via-slate-50 to-slate-100 shadow-[0_12px_36px_-16px_rgba(29,78,216,0.22)] ring-1 ring-gcs-border/40 sm:rounded-[1.35rem]",
        className
      )}
    >
      <div className="relative aspect-[4/3] w-full">
        <Image
          src={s.media.url}
          alt={s.media.alt ?? s.title}
          fill
          className="object-cover object-center"
          sizes="(max-width: 1024px) 100vw, 420px"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent"
          aria-hidden
        />
      </div>
    </div>
  );
}

function SectionCopy({ s }: { s: AboutSection }) {
  const showExec = sectionLinksToExecutives(s);

  return (
    <div className="min-w-0 flex-1">
      {s.subtitle ? (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gcs-primary">{s.subtitle}</p>
      ) : null}
      <h2 className={cn("gcs-topic-title", s.subtitle ? "mt-3" : "")}>{s.title}</h2>
      <SectionBody body={s.body} />
      {showExec ? <ExecutivesLink /> : null}
    </div>
  );
}

function TextOnlySection({ s }: { s: AboutSection }) {
  return (
    <article
      className="rounded-2xl border border-gcs-border/50 bg-gradient-to-br from-blue-50/40 via-white to-white px-7 py-9 shadow-[0_10px_32px_-18px_rgba(29,78,216,0.1)] ring-1 ring-gcs-border/25 sm:rounded-3xl sm:px-10 sm:py-11"
      data-aos="fade-up"
    >
      <SectionCopy s={s} />
    </article>
  );
}

function WideImageSection({ s }: { s: AboutSection }) {
  return (
    <article className="space-y-8 sm:space-y-10" data-aos="fade-up">
      <SectionImage s={s} className="w-full" />
      <div className="rounded-2xl border border-gcs-border/40 bg-white px-7 py-9 shadow-sm ring-1 ring-gcs-border/20 sm:rounded-3xl sm:px-10 sm:py-11">
        <SectionCopy s={s} />
      </div>
    </article>
  );
}

function SplitImageSection({ s, imageOnLeft }: { s: AboutSection; imageOnLeft: boolean }) {
  return (
    <article
      className="rounded-2xl border border-gcs-border/50 bg-white px-6 py-8 shadow-[0_12px_40px_-20px_rgba(29,78,216,0.14)] ring-1 ring-gcs-border/30 sm:rounded-3xl sm:px-8 sm:py-10 md:px-10 md:py-12"
      data-aos="fade-up"
    >
      <div
        className={cn(
          "flex flex-col gap-8 md:gap-10 lg:flex-row lg:items-start lg:gap-12",
          imageOnLeft ? "lg:flex-row" : "lg:flex-row-reverse"
        )}
      >
        <SectionImage s={s} className="w-full lg:w-[min(44%,26rem)] lg:shrink-0" />
        <SectionCopy s={s} />
      </div>
    </article>
  );
}

function AboutSectionBlock({ s, index }: { s: AboutSection; index: number }) {
  if (!s.media) {
    return <TextOnlySection s={s} />;
  }

  if (s.layout === "wide") {
    return <WideImageSection s={s} />;
  }

  const imageOnLeft = s.layout === "reverse" || index % 2 === 1;
  return <SplitImageSection s={s} imageOnLeft={imageOnLeft} />;
}

export function AboutSections({ sections }: { sections: AboutSection[] }) {
  if (sections.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-gcs-border bg-gcs-surface/60 px-8 py-20 text-center">
        <p className="font-semibold text-gcs-foreground">Content coming soon</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 md:space-y-14">
      {sections.map((s, i) => (
        <AboutSectionBlock key={s.id} s={s} index={i} />
      ))}
    </div>
  );
}
