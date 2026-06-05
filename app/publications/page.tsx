import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { PublicationsSidebar } from "@/components/publications/publications-sidebar";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { getFeaturedPublication, getPublishedPublications } from "@/lib/cms-queries";
import { formatPublicationDate } from "@/lib/publication-format";
import { redirect } from "next/navigation";

export const metadata: Metadata = buildMetadata({
  title: "Research & publications",
  description: "Journal issues, bulletins, and technical outputs from the Ghana Chemical Society.",
  path: "/publications",
});

export default async function PublicationsPage() {
  const [featured, all] = await Promise.all([getFeaturedPublication(), getPublishedPublications()]);
  const withCover = all.filter((r) => r.media?.url);

  if (featured && withCover.length === 1) {
    redirect(`/publications/${featured.id}`);
  }

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Publications", path: "/publications" },
        ])}
      />
      <Header />
      <main className="min-h-screen bg-gcs-surface pb-24 pt-28 md:pb-32 md:pt-32">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 md:px-12">
          <header className="max-w-3xl border-b border-gcs-border/60 pb-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gcs-border bg-white px-4 py-1.5 text-sm font-medium text-gcs-muted-text shadow-sm">
              <BookOpen className="h-3.5 w-3.5 text-gcs-primary" aria-hidden />
              Research &amp; publications
            </div>
            <h1 className="gcs-page-title">
              Journal archives
            </h1>
            <p className="gcs-lead mt-5 max-w-xl">
              Browse society journals and special issues. Each volume lists peer-reviewed articles with downloadable PDFs
              where available.
            </p>
          </header>

          {!withCover.length ? (
            <p className="mt-12 text-gcs-muted-text">No published issues yet.</p>
          ) : (
            <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-8">
                {featured ? (
                  <section className="mb-12" aria-labelledby="current-issue-heading">
                    <h2 id="current-issue-heading" className="sr-only">
                      Current issue
                    </h2>
                    <Link
                      href={`/publications/${featured.id}`}
                      className="group flex flex-col overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-gcs-border/55 transition-shadow hover:shadow-lg lg:flex-row lg:rounded-[2rem]"
                    >
                      {featured.media?.url ? (
                        <div className="relative aspect-[3/4] w-full shrink-0 lg:w-[240px]">
                          <Image
                            src={featured.media.url}
                            alt={featured.media.alt ?? featured.title}
                            fill
                            className="object-cover transition duration-500 group-hover:scale-[1.02]"
                            sizes="240px"
                            priority
                          />
                        </div>
                      ) : null}
                      <div className="flex flex-1 flex-col justify-center px-6 py-8 md:px-10">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gcs-primary">Current issue</p>
                        <h3 className="mt-3 text-xl font-semibold leading-snug text-gcs-foreground md:text-2xl">{featured.title}</h3>
                        {featured.publishedAt ? (
                          <p className="mt-2 text-sm text-gcs-muted-text">{formatPublicationDate(featured.publishedAt)}</p>
                        ) : null}
                        <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gcs-primary">
                          Open issue
                          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </span>
                      </div>
                    </Link>
                  </section>
                ) : null}

                <section aria-labelledby="all-issues-heading">
                  <h2
                    id="all-issues-heading"
                    className="border-b-2 border-gcs-primary pb-2 text-xs font-bold uppercase tracking-[0.2em] text-gcs-muted-text"
                  >
                    All issues
                  </h2>
                  <ul className="mt-6 list-none divide-y divide-gcs-border/50">
                    {withCover.map((issue) => (
                      <li key={issue.id}>
                        <Link
                          href={`/publications/${issue.id}`}
                          className="group flex gap-5 py-6 transition-colors hover:bg-white/60"
                        >
                          <div className="relative hidden h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-gcs-border/50 bg-white shadow-sm sm:block">
                            <Image
                              src={issue.media!.url}
                              alt={issue.media!.alt ?? issue.title}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gcs-primary">
                              {issue.featured ? "Current · " : ""}
                              {issue.meta ?? "Publication"}
                            </p>
                            <h3 className="mt-1 text-lg font-semibold text-gcs-foreground group-hover:text-gcs-primary">
                              {issue.title}
                            </h3>
                            {issue.publishedAt ? (
                              <p className="mt-1 text-sm text-gcs-muted-text">{formatPublicationDate(issue.publishedAt)}</p>
                            ) : null}
                          </div>
                          <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-gcs-border transition-colors group-hover:text-gcs-primary" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              <aside className="lg:col-span-4 lg:border-l lg:border-gcs-border/50 lg:pl-10">
                <PublicationsSidebar archives={withCover} />
              </aside>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
