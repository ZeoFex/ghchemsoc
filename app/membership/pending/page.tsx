import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { MembershipPendingView } from "@/components/membership/membership-pending-view";
import { membershipPaymentMethodLabel } from "@/lib/membership-payment-methods";
import { MEMBERSHIP_FEE_GHS } from "@/lib/membership-fee";
import { buildMetadata } from "@/lib/seo";
import type { MembershipPaymentMethod } from "@prisma/client";

export const metadata: Metadata = buildMetadata({
  title: "Payment under review",
  description: "Your membership payment has been received and is being reviewed by the GCS secretariat.",
  path: "/membership/pending",
  noIndex: true,
});

type Props = {
  searchParams: Promise<{
    applicationId?: string;
    ref?: string;
    method?: string;
    reference?: string;
    trxref?: string;
  }>;
};

export default async function MembershipPendingPage({ searchParams }: Props) {
  const { applicationId, ref, method, reference, trxref } = await searchParams;
  const paystackRef = reference ?? trxref ?? ref;
  const methodLabel =
    method && (method as MembershipPaymentMethod)
      ? membershipPaymentMethodLabel(method as MembershipPaymentMethod)
      : null;

  return (
    <>
      <Header />
      <MembershipPendingView
        applicationId={applicationId}
        paystackRef={paystackRef}
        methodLabel={methodLabel}
        amountGhs={MEMBERSHIP_FEE_GHS}
      />
    </>
  );
}
