import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, UserRound } from "lucide-react";
import { Header } from "@/components/layout/header";
import { ContactFooter } from "@/components/home/contact-footer";
import { getPublishedExecutiveById } from "@/lib/cms-queries";

export const metadata: Metadata = {
  title: "Executive profile | Ghana Chemical Society",
  description: "Executive leadership profile for the Ghana Chemical Society.",
};

export default async function ExecutiveProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exec = await getPublishedExecutiveById(id);
  if (!exec) notFound();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white text-gcs-foreground">
        <section className="relative overflow-hidden border-b border-blue-100/70">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(29,78,216,0.14),transparent_55%)]"
            aria-hidden
          />
          <div className="relative mx-auto max-w-[1100px] px-4 pb-12 pt-28 sm:px-6 md:px-10 md:pb-14 md:pt-32">
            <Link
              href="/executives"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gcs-primary hover:text-gcs-primary-hover"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to executives
            </Link>

            <div className="mt-10 grid gap-10 md:grid-cols-[340px_1fr] md:items-start">
              <div className="rounded-3xl border border-blue-100/80 bg-white p-5 shadow-[0_14px_40px_-18px_rgba(29,78,216,0.22)] ring-1 ring-blue-50">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-blue-50/80 to-white">
                  <div className="relative mx-auto aspect-[7/9] w-full max-w-[320px]">
                    {exec.media?.url ? (
                      <Image
                        src={exec.media.url}
                        alt={exec.media.alt ?? exec.name}
                        fill
                        className="object-contain object-center"
                        sizes="(max-width: 768px) 80vw, 320px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-500">
                        <UserRound className="h-10 w-10" aria-hidden />
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-5 text-center">
                  <h1 className="text-2xl font-semibold tracking-tight text-gcs-foreground">{exec.name}</h1>
                  <p className="mt-1 text-sm font-semibold uppercase tracking-[0.14em] text-gcs-primary">{exec.role}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Profile</p>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">About {exec.name}</h2>
                {exec.bio ? (
                  <div className="prose prose-slate mt-5 max-w-none">
                    <p className="text-sm leading-relaxed text-slate-700 sm:text-[0.98rem]">{exec.bio}</p>
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-slate-600">
                    A full biography will be published soon.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <ContactFooter />
      </main>
    </>
  );
}

