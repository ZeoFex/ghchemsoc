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
    <div className="mt-4 space-y-3 text-sm leading-relaxed text-gcs-muted-text sm:text-[0.95rem]">
      {blocks.map((block, j) => (
        <p key={j}>{block.trim()}</p>
      ))}
    </div>
  );
}

function ImageCard({ s, featured }: { s: AboutSection; featured?: boolean }) {
  const showExec = sectionLinksToExecutives(s);
  const reverseDesktop = s.layout === "reverse";

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border border-gcs-border/50 bg-white shadow-[0_12px_40px_-18px_rgba(29,78,216,0.12)] ring-1 ring-gcs-border/30 sm:rounded-3xl",
        // Split layout + bigger cards on desktop
        "md:grid md:grid-cols-2 md:items-stretch",
        featured ? "md:col-span-2" : ""
      )}
      data-aos="fade-up"
    >
      <div
        className={cn(
          "relative w-full overflow-hidden bg-slate-100",
          // Mobile: image on top; Desktop: split panel
          "aspect-[16/10] sm:aspect-[2/1] md:aspect-auto md:min-h-[340px]",
          reverseDesktop ? "md:order-1" : "md:order-2"
        )}
      >
        <Image
          src={s.media!.url}
          alt={s.media!.alt ?? s.title}
          fill
          className="object-cover object-center"
          sizes={featured ? "(max-width: 768px) 100vw, 1100px" : "(max-width: 768px) 100vw, 540px"}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent md:bg-gradient-to-l md:from-slate-950/15 md:via-transparent md:to-transparent" />
      </div>

      <div
        className={cn(
          "border-t border-gcs-border/40 px-5 py-7 sm:px-7 sm:py-8",
          "md:border-t-0 md:border-gcs-border/40 md:px-10 md:py-12",
          reverseDesktop ? "md:order-2 md:border-l" : "md:order-1 md:border-r"
        )}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gcs-muted-text">About</p>
        <h2 className="mt-3 text-xl font-semibold tracking-tight text-gcs-foreground sm:text-2xl">{s.title}</h2>
        {s.subtitle ? <p className="mt-2 text-sm font-semibold text-gcs-primary sm:text-base">{s.subtitle}</p> : null}
        <SectionBody body={s.body} />
        {showExec ? (
          <Link
            href="/executives"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gcs-primary hover:text-gcs-primary-hover"
          >
            View leadership
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function TextCard({ s }: { s: AboutSection }) {
  const showExec = sectionLinksToExecutives(s);

  return (
    <article
      className="rounded-2xl border border-gcs-border/50 bg-gradient-to-br from-blue-50/50 via-white to-white px-6 py-8 shadow-sm ring-1 ring-gcs-border/25 sm:rounded-3xl sm:px-8 sm:py-10"
      data-aos="fade-up"
    >
      <h2 className="text-lg font-semibold tracking-tight text-gcs-foreground sm:text-xl">{s.title}</h2>
      {s.subtitle ? <p className="mt-1 text-sm font-medium text-gcs-primary sm:text-base">{s.subtitle}</p> : null}
      <SectionBody body={s.body} />
      {showExec ? (
        <Link
          href="/executives"
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-gcs-primary hover:text-gcs-primary-hover"
        >
          View leadership
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      ) : null}
    </article>
  );
}

export function AboutSections({ sections }: { sections: AboutSection[] }) {
  if (sections.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-gcs-border bg-gcs-surface/60 px-8 py-20 text-center">
        <p className="font-semibold text-gcs-foreground">Content coming soon</p>
      </div>
    );
  }

  const withImages = sections.filter((s) => s.media);
  const withoutImages = sections.filter((s) => !s.media);

  return (
    <div className="space-y-8 md:space-y-10">
      {withoutImages.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          {withoutImages.map((s) => (
            <TextCard key={s.id} s={s} />
          ))}
        </div>
      ) : null}

      {withImages.length > 0 ? (
        <div className="grid gap-6 md:gap-8">
          {withImages.map((s, i) => (
            <ImageCard
              key={s.id}
              s={{
                ...s,
                // Alternate layout: text-left/image-right, then image-left/text-right
                layout: s.layout === "wide" ? "wide" : i % 2 === 1 ? "reverse" : s.layout,
              }}
              featured={i === 0 || s.layout === "wide"}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
