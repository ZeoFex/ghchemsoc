import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CmsNotificationCounts = {
  unreadContactInquiries: number;
  unreadRegistrations: number;
  unreadTestimonialSubmissions: number;
  pendingMembershipPayments: number;
  totalUnread: number;
};

export const emptyCmsNotificationCounts = (): CmsNotificationCounts => ({
  unreadContactInquiries: 0,
  unreadRegistrations: 0,
  unreadTestimonialSubmissions: 0,
  pendingMembershipPayments: 0,
  totalUnread: 0,
});

function isTransientDbError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return ["P1001", "P1002", "P1017"].includes(err.code);
  }
  const msg = err instanceof Error ? err.message : String(err);
  return /can't reach database server|connection|timed out|ECONNREFUSED/i.test(msg);
}

async function queryCounts(): Promise<CmsNotificationCounts> {
  const [unreadContactInquiries, unreadRegistrations, unreadTestimonialSubmissions, pendingMembershipPayments] = await Promise.all([
    prisma.contactInquiry.count({ where: { read: false } }),
    prisma.eventRegistration.count({ where: { read: false } }),
    prisma.testimonialSubmission.count({ where: { read: false, status: "pending" } }),
    prisma.membershipApplication.count({
      where: { status: "payment_submitted", paymentStatus: "submitted", read: false },
    }),
  ]);
  return {
    unreadContactInquiries,
    unreadRegistrations,
    unreadTestimonialSubmissions,
    pendingMembershipPayments,
    totalUnread: unreadContactInquiries + unreadRegistrations + unreadTestimonialSubmissions + pendingMembershipPayments,
  };
}

/**
 * Unread inbox totals for the CMS. On Neon sleep / brief outages, retries once then returns zeros
 * so the admin UI (and publication uploads) are not blocked by background notification polling.
 */
export async function getCmsNotificationCounts(): Promise<{
  counts: CmsNotificationCounts;
  degraded: boolean;
}> {
  try {
    return { counts: await queryCounts(), degraded: false };
  } catch (err) {
    if (!isTransientDbError(err)) {
      console.error("[cms-notifications] count failed:", err);
      return { counts: emptyCmsNotificationCounts(), degraded: true };
    }
    await new Promise((r) => setTimeout(r, 900));
    try {
      return { counts: await queryCounts(), degraded: false };
    } catch (retryErr) {
      console.warn("[cms-notifications] database unreachable, using empty counts:", retryErr);
      return { counts: emptyCmsNotificationCounts(), degraded: true };
    }
  }
}
