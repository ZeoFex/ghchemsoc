import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
    title: "Sign in",
    description: "Sign in to the Ghana Chemical Society member and staff portal.",
    path: "/login",
    noIndex: true,
});

const heroImage =
    "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=2000&auto=format&fit=crop";

export default function LoginPage() {
    return (
        <main className="flex min-h-screen flex-col bg-white lg:flex-row">
            {/* Image / brand panel */}
            <div className="relative hidden min-h-screen w-full shrink-0 lg:block lg:w-[min(48%,560px)] lg:flex-1 lg:max-w-none">
                <Image
                    src={heroImage}
                    alt="Researchers working in a chemistry laboratory"
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div
                    className="absolute inset-0 bg-gradient-to-br from-slate-950/92 via-blue-950/88 to-slate-900/90"
                    aria-hidden
                />
                <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:20px_20px]" />

                <div className="absolute inset-0 flex flex-col justify-between p-6 text-white sm:p-8 lg:p-10 xl:p-12">
                    <Link
                        href="/"
                        className="pointer-events-auto inline-flex w-fit items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-md transition hover:bg-white/20"
                    >
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gcs-primary">
                            <FlaskConical className="h-5 w-5" aria-hidden />
                        </span>
                        <span className="flex flex-col leading-tight">
                            <span className="text-base font-bold tracking-tight">GCS</span>
                            <span className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-white/80">
                                Ghana Chemical Society
                            </span>
                        </span>
                    </Link>

                    <div className="max-w-md space-y-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-200/90">Portal access</p>
                        <h1 className="text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl lg:text-[2.125rem] lg:leading-[1.15] xl:text-4xl">
                            Science, collaboration, and chemistry across Ghana.
                        </h1>
                        <p className="text-sm leading-relaxed text-white/75 lg:text-base">
                            Members unlock their portfolio with email and member ID. Staff and administrators use secure
                            email and password.
                        </p>
                    </div>

                    <p className="text-xs text-white/45">Laboratory research imagery — illustrative only.</p>
                </div>
            </div>

            {/* Form panel */}
            <div className="flex flex-1 flex-col justify-center border-t border-slate-100 bg-gradient-to-b from-white to-slate-50/80 px-5 py-10 sm:px-10 lg:border-l lg:border-t-0 lg:border-slate-200/80 lg:px-12 xl:px-16">
                <div className="mx-auto w-full max-w-md lg:mx-0">
                    <Link
                        href="/"
                        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-gcs-primary"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden />
                        Back to site
                    </Link>

                    <Suspense
                        fallback={
                            <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500 shadow-sm">
                                Loading sign-in…
                            </div>
                        }
                    >
                        <LoginForm />
                    </Suspense>
                </div>
            </div>
        </main>
    );
}
