import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { ResourcesFeatured } from "@/components/resources/resources-featured";
import { ResourcesGrid } from "@/components/resources/resources-grid";
import { getPublishedSocietyResources, getResourcesPageForPublic } from "@/lib/cms-queries";
import { resolveVideoPlayback } from "@/lib/society-resources";
import { ArrowUpRight, FolderOpen, Library, Sparkles } from "lucide-react";

export const metadata: Metadata = buildMetadata({
  title: "Resources",
  description:
    "Videos, documents, and reference materials from the Ghana Chemical Society — conference recordings, guides, and useful links.",
  path: "/resources",
});

export default async function ResourcesPage() {
  const [page, items] = await Promise.all([getResourcesPageForPublic(), getPublishedSocietyResources()]);

  const featured =
    items.find((i) => i.kind === "video" && resolveVideoPlayback(i.url)) ?? items[0] ?? null;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Resources", path: "/resources" },
        ])}
      />
      <Header />
      <main className="relative min-h-screen overflow-x-hidden pb-24 pt-24 md:pb-32 md:pt-28">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f8fafc] to-white" />
          <div className="absolute -top-40 left-[10%] h-[420px] w-[420px] rounded-full bg-gcs-primary/[0.07] blur-3xl" />
          <div className="absolute top-[20%] right-0 h-[380px] w-[480px] translate-x-1/4 rounded-full bg-blue-300/25 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-blue-200/20 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.025] [background-image:radial-gradient(circle_at_1px_1px,#1e40af_1px,transparent_0)] [background-size:28px_28px]"
            aria-hidden
          />
        </div>

        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 md:px-12">
          <header
            className="relative flex flex-col gap-10 border-b border-gcs-border/70 pb-12 md:flex-row md:items-end md:justify-between md:pb-16"
            data-aos="fade-up"
            data-aos-duration="700"
          >
            <div className="max-w-2xl md:max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gcs-border/80 bg-white/80 px-4 py-1.5 text-sm font-medium text-gcs-muted-text shadow-sm backdrop-blur-md">
                <FolderOpen className="h-3.5 w-3.5 text-gcs-primary" aria-hidden />
                {page.eyebrow}
              </div>
              <h1 className="gcs-page-title break-words">{page.headline}</h1>
              <p className="gcs-lead mt-5 max-w-xl">{page.lead}</p>
              {items.length > 0 ? (
                <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-gcs-muted-text">
                  <Library className="h-4 w-4 text-gcs-primary" aria-hidden />
                  {items.length} {items.length === 1 ? "resource" : "resources"} available
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/membership"
                className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gcs-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-gcs-primary/25 transition hover:bg-gcs-primary-hover hover:shadow-xl hover:shadow-gcs-primary/30"
              >
                Member access
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link
                href="/events"
                className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-gcs-border/90 bg-white/90 px-6 py-3 text-sm font-semibold text-gcs-foreground shadow-sm backdrop-blur-sm transition hover:border-gcs-primary/40 hover:text-gcs-primary"
              >
                Events
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </header>

          {items.length === 0 ? (
            <div
              className="mt-16 rounded-[2rem] border border-dashed border-gcs-border/80 bg-white/80 px-8 py-20 text-center shadow-sm backdrop-blur-sm"
              data-aos="fade-up"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gcs-primary/10 text-gcs-primary">
                <Library className="h-8 w-8" aria-hidden />
              </div>
              <p className="mt-6 text-xl font-semibold text-gcs-foreground">Library coming soon</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gcs-muted-text">
                Conference recordings, technical guides, and society materials will appear here as they are published.
              </p>
            </div>
          ) : (
            <>
              {featured ? (
                <section className="mt-14 lg:mt-16" aria-labelledby="resources-spotlight" data-aos="fade-up" data-aos-delay="60">
                  <div className="mb-6 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-gcs-primary" aria-hidden />
                    <h2 id="resources-spotlight" className="text-sm font-semibold uppercase tracking-[0.2em] text-gcs-muted-text">
                      Spotlight
                    </h2>
                  </div>
                  <ResourcesFeatured item={featured} />
                </section>
              ) : null}

              <section className="mt-16 lg:mt-20" aria-label="Resource library" data-aos="fade-up" data-aos-delay="100">
                <ResourcesGrid items={items} excludeId={featured?.id} />
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}
