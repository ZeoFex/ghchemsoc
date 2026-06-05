import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { PublicationIssueView } from "@/components/publications/publication-issue-view";
import { getPublishedPublicationById, getPublishedPublications } from "@/lib/cms-queries";
import { ArrowLeft } from "lucide-react";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params;
  const issue = await getPublishedPublicationById(id);
  if (!issue) {
    return buildMetadata({ title: "Issue not found", path: `/publications/${id}`, noIndex: true });
  }
  return buildMetadata({
    title: issue.title,
    description: issue.description.slice(0, 160),
    path: `/publications/${id}`,
    image: issue.media?.url,
    imageAlt: issue.media?.alt ?? issue.title,
    publishedTime: issue.publishedAt ?? undefined,
    type: "article",
    absoluteTitle: true,
  });
}

export default async function PublicationIssuePage(props: PageProps) {
  const { id } = await props.params;
  const [issue, archives] = await Promise.all([getPublishedPublicationById(id), getPublishedPublications()]);
  if (!issue) notFound();

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Archives", href: "/publications" },
    { label: issue.title },
  ];

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Publications", path: "/publications" },
          { name: issue.title },
        ])}
      />
      <Header />
      <main className="min-h-screen bg-white pb-24 pt-28 md:pb-32 md:pt-32">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 md:px-12">
          <Link
            href="/publications"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-gcs-primary hover:text-gcs-primary-hover"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to archives
          </Link>

          <PublicationIssueView issue={issue} archives={archives} breadcrumbs={breadcrumbs} />
        </div>
      </main>
    </>
  );
}
