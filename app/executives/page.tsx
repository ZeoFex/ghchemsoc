import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { ContactFooter } from "@/components/home/contact-footer";
import { ExecutivesGrid } from "@/components/executives/executives-grid";
import { getPublishedExecutives } from "@/lib/cms-queries";
import { ArrowLeft, Users } from "lucide-react";

export const metadata: Metadata = buildMetadata({
  title: "Executives",
  description: "Officers and executive leadership of the Ghana Chemical Society.",
  path: "/executives",
});

export default async function ExecutivesPage() {
  const executives = await getPublishedExecutives();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Executives", path: "/executives" },
        ])}
      />
      <Header />
      <main className="min-h-screen bg-white text-gcs-foreground">
        <section className="relative overflow-hidden border-b border-blue-100/70">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(29,78,216,0.14),transparent_55%)]"
            aria-hidden
          />
          <div className="relative mx-auto max-w-[1440px] px-4 pb-14 pt-28 sm:px-6 md:px-12 md:pb-16 md:pt-32">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gcs-primary hover:text-gcs-primary-hover"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to about
            </Link>
            <header className="mx-auto mt-8 max-w-3xl text-center md:mt-10">
              <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/90 px-4 py-1.5 text-sm font-semibold text-slate-600 shadow-sm">
                <Users className="h-4 w-4 text-gcs-primary" aria-hidden />
                Leadership
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-gcs-foreground md:text-4xl">Executive officers</h1>
              <p className="gcs-lead mx-auto mt-5 max-w-2xl">
                The elected and appointed leaders who steward programmes, governance, and representation for members
                across Ghana.
              </p>
            </header>
          </div>
        </section>

        <section className="bg-gradient-to-b from-blue-50/40 via-white to-white">
          <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 md:px-10 md:py-20">
            <ExecutivesGrid executives={executives} />
          </div>
        </section>

        <ContactFooter />
      </main>
    </>
  );
}
