import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { JsonLd } from "@/components/seo/json-ld";
import { articleJsonLd, breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { NewsArticleHtml } from "@/components/news/news-article-html";
import { NewsArticleSidebar } from "@/components/news/news-article-sidebar";
import { ArrowLeft } from "lucide-react";
import { getNewsBySlug, getPublishedNewsItems } from "@/lib/cms-queries";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getNewsBySlug(slug);
  if (!post) {
    return buildMetadata({ title: "News not found", path: `/news/${slug}`, noIndex: true });
  }
  return buildMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/news/${slug}`,
    image: post.media?.url,
    imageAlt: post.media?.alt ?? post.title,
    type: "article",
    publishedTime: post.date,
    absoluteTitle: true,
  });
}

function fmt(d: Date) {
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function NewsArticlePage({ params }: Props) {
  const { slug } = await params;
  const [post, allNews] = await Promise.all([getNewsBySlug(slug), getPublishedNewsItems()]);
  if (!post) notFound();

  const hasAuthor = Boolean(post.authorName?.trim());

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "News", path: "/news" },
            { name: post.title },
          ]),
          articleJsonLd({
            title: post.title,
            description: post.excerpt,
            path: `/news/${slug}`,
            image: post.media?.url,
            datePublished: post.date,
            authorName: post.authorName,
          }),
        ]}
      />
      <Header />
      <main className="min-h-screen bg-white pb-24 pt-28 md:pb-32 md:pt-32">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 md:px-12">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gcs-primary hover:text-gcs-primary-hover"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to news
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-12">
            <article className="min-w-0 lg:col-span-8">
              <header className="border-b border-gcs-border pb-8">
                <time
                  dateTime={post.date.toISOString()}
                  className="text-xs font-semibold uppercase tracking-[0.18em] text-gcs-muted-text"
                >
                  {fmt(post.date)}
                </time>
                <h1 className="mt-4 break-words text-2xl font-medium tracking-tight text-gcs-foreground sm:text-3xl md:text-4xl">
                  {post.title}
                </h1>
                {hasAuthor ? (
                  <p className="mt-4 text-sm text-gcs-muted-text">
                    <span className="font-semibold text-gcs-foreground">{post.authorName}</span>
                    {post.authorRole ? (
                      <>
                        <span className="mx-1.5 text-gcs-border" aria-hidden>
                          ·
                        </span>
                        {post.authorRole}
                      </>
                    ) : null}
                  </p>
                ) : null}
                <p className="mt-4 text-lg leading-relaxed text-gcs-muted-text">{post.excerpt}</p>
              </header>

              {post.media ? (
                <div className="relative mt-10 aspect-[16/10] w-full overflow-hidden rounded-2xl border border-gcs-border bg-gcs-surface">
                  <Image
                    src={post.media.url}
                    alt={post.media.alt ?? post.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    priority
                  />
                </div>
              ) : null}

              {post.body ? <NewsArticleHtml html={post.body} className="mt-10" /> : null}
            </article>

            <aside className="lg:col-span-4 lg:border-l lg:border-gcs-border/50 lg:pl-10">
              <div className="lg:sticky lg:top-32">
                <NewsArticleSidebar items={allNews} currentSlug={slug} />
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
