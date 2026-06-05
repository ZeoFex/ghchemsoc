import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { ArrowUpRight, Newspaper } from "lucide-react";
import { getPublishedNewsItems } from "@/lib/cms-queries";

export const metadata: Metadata = buildMetadata({
  title: "News",
  description: "Society announcements, conferences, and updates for GCS members.",
  path: "/news",
});

function fmt(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function NewsPage() {
  const items = await getPublishedNewsItems();

  const list = items.filter(
    (n) => n.media && n.media.url
  );

  const featured = list[0];
  const rest = list.slice(1);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "News", path: "/news" },
        ])}
      />
      <Header />

      <main className="min-h-screen bg-white pb-24 pt-28 md:pb-32 md:pt-32">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 md:px-12">

          <header className="flex flex-col gap-10 border-b border-gcs-border pb-10 md:flex-row md:items-end md:justify-between md:pb-12">
            <div className="max-w-2xl md:max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gcs-border bg-white px-4 py-1.5 text-sm font-medium text-gcs-muted-text shadow-sm">
                <Newspaper
                  className="h-3.5 w-3.5 text-gcs-primary"
                  aria-hidden
                />
                News &amp; announcements
              </div>

              <h1 className="gcs-page-title">
                From the society desk
              </h1>

              <p className="gcs-lead mt-5 max-w-xl">
                Announcements and articles from the Ghana Chemical Society desk.
              </p>
            </div>

            <Link
              href="/events"
              className="group inline-flex shrink-0 items-center gap-2 self-start text-sm font-semibold text-gcs-primary transition-colors hover:text-gcs-primary-hover md:self-auto"
            >
              Events calendar
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </header>

          {!featured ? (
            <p className="mt-12 text-gcs-muted-text">
              No published news with images yet.
            </p>
          ) : (
            <>
              <section
                className="mt-12 lg:mt-14"
                aria-labelledby="featured-news-heading"
              >
                <h2
                  id="featured-news-heading"
                  className="sr-only"
                >
                  Featured story
                </h2>

                <article className="overflow-hidden rounded-[1.75rem] border border-gcs-border/55 bg-gcs-surface ring-1 ring-gcs-border/20 lg:rounded-[2rem]">
                  <div className="flex flex-col lg:min-h-[300px] lg:flex-row">

                    <div className="relative aspect-[16/10] w-full shrink-0 lg:aspect-auto lg:w-[46%] lg:min-h-[300px]">
                      <Image
                        src={featured.media?.url || "/fallback-news.jpg"}
                        alt={featured.media?.alt || featured.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 44vw"
                        priority
                      />
                    </div>

                    <div className="flex flex-1 flex-col justify-center border-t border-gcs-border/60 bg-gcs-surface px-6 py-8 md:px-10 lg:border-l lg:border-t-0">
                      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-gcs-muted-text">
                        <span className="rounded-full border border-gcs-border/80 bg-neutral-50 px-3 py-1 text-gcs-primary">
                          Featured
                        </span>

                        <span
                          className="h-1 w-1 rounded-full bg-gcs-border"
                          aria-hidden
                        />

                        <time
                          dateTime={new Date(
                            featured.date
                          ).toISOString()}
                        >
                          {fmt(featured.date)}
                        </time>
                      </div>

                      <h3 className="mt-4 text-2xl font-semibold tracking-tight text-gcs-foreground md:text-[1.65rem] md:leading-snug">
                        {featured.title}
                      </h3>

                      <p className="mt-3 max-w-xl text-sm leading-relaxed text-gcs-muted-text md:text-[0.9375rem]">
                        {featured.excerpt}
                      </p>

                      <Link
                        href={`/news/${featured.slug}`}
                        className="group mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-gcs-border bg-white px-5 py-2.5 text-sm font-semibold text-gcs-foreground shadow-sm transition-colors hover:border-gcs-primary hover:bg-gcs-primary hover:text-white"
                      >
                        Read article
                        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              </section>

              <section
                className="mt-14 lg:mt-16"
                aria-labelledby="recent-heading"
              >
                <h2
                  id="recent-heading"
                  className="text-xl font-semibold tracking-tight text-gcs-foreground md:text-2xl"
                >
                  More updates
                </h2>

                <ul className="mt-8 grid list-none gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {rest.map((post) => (
                    <li key={post.id}>
                      <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gcs-border/50 bg-gcs-surface ring-1 ring-gcs-border/15 transition-colors hover:border-gcs-border hover:bg-neutral-50/80">

                        <Link
                          href={`/news/${post.slug}`}
                          className="flex flex-1 flex-col"
                        >
                          <div className="relative aspect-[16/11] w-full shrink-0 overflow-hidden border-b border-gcs-border/40">
                            <Image
                              src={post.media?.url || "/fallback-news.jpg"}
                              alt={post.media?.alt || post.title}
                              fill
                              className="object-cover transition duration-500 group-hover:scale-[1.02]"
                              sizes="(max-width: 640px) 100vw, 33vw"
                            />
                          </div>

                          <div className="flex flex-1 flex-col p-5">
                            <time
                              className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-gcs-muted-text"
                              dateTime={new Date(
                                post.date
                              ).toISOString()}
                            >
                              {fmt(post.date)}
                            </time>

                            <h3 className="mt-3 text-base font-semibold leading-snug tracking-tight text-gcs-foreground">
                              {post.title}
                            </h3>

                            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gcs-muted-text">
                              {post.excerpt}
                            </p>

                            <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-gcs-primary transition-colors group-hover:text-gcs-primary-hover">
                              Continue reading
                              <ArrowUpRight className="h-4 w-4" />
                            </span>
                          </div>
                        </Link>
                      </article>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}

          <aside className="mt-16 rounded-2xl border border-gcs-border bg-gcs-surface px-6 py-8 md:flex md:items-center md:justify-between md:gap-10 md:px-10 md:py-10">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gcs-muted-text">
                Media &amp; submissions
              </p>

              <p className="mt-3 text-base font-medium text-gcs-foreground md:text-lg">
                Pitch a story or request an official statement
              </p>

              <p className="mt-2 text-sm leading-relaxed text-gcs-muted-text">
                Faculty chapters, industry partners, and student reps can route
                announcements through the secretariat.
              </p>
            </div>

            <Link
              href="/contact"
              className="group mt-6 inline-flex items-center gap-2 rounded-full bg-gcs-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gcs-primary-hover md:mt-0 md:shrink-0"
            >
              Contact us
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </aside>

        </div>
      </main>
    </>
  );
}