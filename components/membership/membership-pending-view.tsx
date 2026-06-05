"use client";

import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Home,
  Mail,
  MessageCircle,
} from "lucide-react";
import { PendingPaymentVerifier } from "@/components/membership/pending-payment-verifier";
import { formatGhs, MEMBERSHIP_FEE_GHS } from "@/lib/membership-fee";

export type MembershipPendingViewProps = {
  applicationId?: string;
  paystackRef?: string;
  methodLabel?: string | null;
  amountGhs?: number;
};

export function MembershipPendingView({
  applicationId,
  paystackRef,
  methodLabel,
  amountGhs = MEMBERSHIP_FEE_GHS,
}: MembershipPendingViewProps) {
  const hasPaymentDetails = Boolean(methodLabel || amountGhs);
  const hasReference = Boolean(paystackRef || applicationId);

  return (
    <main className="min-h-screen bg-gcs-muted-bg px-4 pb-12 pt-24 sm:px-6 sm:pt-28 md:pb-16 md:pt-32">
      <div className="mx-auto w-full max-w-lg">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_-12px_rgba(15,23,42,0.1)]">
          <div className="px-6 py-10 text-center sm:px-8 sm:py-12">
            <span className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-900">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              Under review
            </span>

            <span
              className="mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gcs-primary/10 text-gcs-primary ring-1 ring-gcs-primary/10"
              aria-hidden
            >
              <Clock className="h-7 w-7" strokeWidth={1.75} />
            </span>

            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-gcs-foreground sm:text-[1.65rem]">
              Payment received
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gcs-muted-text sm:text-[0.9375rem]">
              The GCS secretariat is reviewing your application.
            </p>

            {hasPaymentDetails ? (
              <p className="mx-auto mt-4 inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-slate-200/80 bg-slate-50/80 px-4 py-2 text-sm text-gcs-foreground">
                <span className="font-semibold">{formatGhs(amountGhs)}</span>
                {methodLabel ? (
                  <>
                    <span className="text-slate-300" aria-hidden>
                      ·
                    </span>
                    <span className="text-gcs-muted-text">{methodLabel}</span>
                  </>
                ) : null}
              </p>
            ) : null}

            <p className="mx-auto mt-5 flex max-w-xs items-start justify-center gap-2 text-left text-sm text-gcs-muted-text sm:max-w-sm sm:justify-center">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gcs-primary" aria-hidden />
              <span>We&apos;ll email you when your membership is approved.</span>
            </p>

            {applicationId && paystackRef ? (
              <PendingPaymentVerifier applicationId={applicationId} reference={paystackRef} />
            ) : null}
          </div>

          {hasReference ? (
            <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:px-8">
              <dl className="space-y-2 text-sm">
                {paystackRef ? (
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                    <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-gcs-muted-text">
                      Reference
                    </dt>
                    <dd className="break-all font-mono text-xs font-medium text-gcs-foreground sm:text-right">
                      {paystackRef}
                    </dd>
                  </div>
                ) : null}
                {applicationId ? (
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                    <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-gcs-muted-text">
                      Application
                    </dt>
                    <dd className="break-all font-mono text-xs text-gcs-foreground sm:text-right">
                      {applicationId}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : null}

          <div className="flex flex-col gap-2.5 border-t border-slate-100 px-6 py-5 sm:flex-row sm:px-8">
            <Link
              href="/"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gcs-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gcs-primary-hover"
            >
              <Home className="h-4 w-4" aria-hidden />
              Back to homepage
            </Link>
            <Link
              href="/contact"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-gcs-foreground transition hover:border-gcs-primary/30"
            >
              <MessageCircle className="h-4 w-4 text-gcs-primary" aria-hidden />
              Contact us
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gcs-muted-text">
          Already approved?{" "}
          <Link href="/login" className="font-semibold text-gcs-primary hover:underline">
            Sign in
            <ArrowRight className="ml-0.5 inline h-3 w-3" aria-hidden />
          </Link>
        </p>
      </div>
    </main>
  );
}
