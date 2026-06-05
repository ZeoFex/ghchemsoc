import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { MembershipLoginLink } from "@/components/membership/membership-login-link";
import { MembershipRegistrationForm } from "@/components/membership/membership-registration-form";
import { formatGhs, MEMBERSHIP_FEE_GHS } from "@/lib/membership-fee";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FlaskConical,
  LogIn,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react";

export const metadata: Metadata = buildMetadata({
  title: "Membership registration and renewal",
  description:
    "Register or renew your Ghana Chemical Society membership—certificate name, affiliation, and declaration.",
  path: "/membership",
});

const heroImage =
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=2000&q=80";

const benefits: { icon: LucideIcon; text: string }[] = [
  { icon: CalendarDays, text: "Reduced rates at GCS conferences and symposia" },
  { icon: BookOpen, text: "Publications and technical notices for members" },
  { icon: Users, text: "Networking across universities, industry, and regulators" },
  { icon: Shield, text: "Voting rights and committee participation (by tier)" },
];

const assurances = [
  "Secure online submission",
  "Secretariat reviews every application",
  "Member ID after verified payment",
];

function BenefitsList() {
  return (
    <>
      <ul className="space-y-2">
        {benefits.map(({ icon: Icon, text }) => (
          <li
            key={text}
            className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 backdrop-blur-sm"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-sky-100">
              <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            </span>
            <span className="pt-1 text-sm leading-snug text-white/90">{text}</span>
          </li>
        ))}
      </ul>
      <ul className="mt-4 space-y-1.5 text-xs text-white/70">
        {assurances.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-300/90" strokeWidth={2} aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </>
  );
}

export default function MembershipPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white lg:flex-row">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Membership", path: "/membership" },
        ])}
      />
      {/* Desktop — benefits on image */}
      <div className="relative hidden min-h-screen w-full shrink-0 lg:block lg:w-[min(44%,520px)] lg:max-w-[540px] xl:w-[min(42%,580px)]">
        <Image
          src={heroImage}
          alt="Chemistry conference and professional gathering"
          fill
          priority
          className="object-cover"
          sizes="44vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-slate-950/93 via-blue-950/90 to-blue-900/92"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:20px_20px]"
          aria-hidden
        />

        <div className="absolute inset-0 flex flex-col items-start justify-start gap-4 p-10 text-white">
          <Link
            href="/"
            className="inline-flex w-fit shrink-0 items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-md transition hover:bg-white/20"
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

          <div className="w-full max-w-md space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-200/90">Member benefits</p>
              <h1 className="mt-2 text-[1.75rem] font-semibold leading-[1.2] tracking-tight text-white">
                Join a national community of chemists and chemical professionals.
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                Annual membership is {formatGhs(MEMBERSHIP_FEE_GHS)} — active for 12 months from verified payment.
              </p>
            </div>
            <BenefitsList />
          </div>

          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/45">
            <span>Illustrative imagery.</span>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1 font-semibold text-sky-200/80 transition hover:text-white"
            >
              Contact secretariat
              <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </p>
        </div>
      </div>

      {/* Registration form panel */}
      <div className="flex min-h-0 flex-1 flex-col lg:min-h-screen lg:overflow-y-auto">
        {/* Mobile — no image; benefits on dark panel */}
        <div className="border-b border-white/10 bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 px-4 pb-5 pt-5 text-white lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex min-w-0 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-sm"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-gcs-primary">
                <FlaskConical className="h-4 w-4" aria-hidden />
              </span>
              <span className="truncate text-sm font-bold text-white">GCS</span>
            </Link>
            <Link
              href="/login?role=member"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm"
            >
              <LogIn className="h-3.5 w-3.5" aria-hidden />
              Login
            </Link>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200/90">Member benefits</p>
            <p className="mt-2 text-base font-semibold leading-snug tracking-tight text-white">
              Join a national community of chemists and chemical professionals.
            </p>
            <p className="mt-1.5 text-sm text-white/75">
              <span className="font-semibold text-white">{formatGhs(MEMBERSHIP_FEE_GHS)}</span> per year · active 12
              months after verified payment
            </p>
          </div>

          <div className="mt-4">
            <BenefitsList />
          </div>
        </div>

        <div className="flex flex-1 flex-col bg-gradient-to-b from-white to-slate-50/80 px-4 py-6 sm:px-6 lg:justify-center lg:border-l lg:border-gcs-border/60 lg:px-10 lg:py-8 xl:px-12">
          <div className="mx-auto w-full max-w-xl lg:max-w-2xl">
            <div className="mb-5 hidden flex-wrap items-center justify-between gap-3 lg:flex">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-gcs-primary"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Back to site
              </Link>
              <Link
                href="/login?role=member"
                className="inline-flex items-center gap-1.5 rounded-full border border-gcs-border bg-white px-4 py-2 text-xs font-semibold text-gcs-muted-text shadow-sm transition hover:border-gcs-primary/30 hover:text-gcs-primary"
              >
                <LogIn className="h-3.5 w-3.5" aria-hidden />
                Member login
              </Link>
            </div>

            <div id="register">
              <MembershipRegistrationForm />
            </div>

            <p className="mt-5 text-center text-sm text-gcs-muted-text">
              Already approved? <MembershipLoginLink variant="inline" />
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
