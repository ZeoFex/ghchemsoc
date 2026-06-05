import type { MembershipApplication, MembershipApplicationStatus } from "@prisma/client";
import { databaseUnavailableMessage, isDbConnectionError } from "@/lib/db-fallback";
import { normalizeMembershipEmail } from "@/lib/member-email";
import { prisma, prismaReady, resetPrismaClient } from "@/lib/prisma";

export type MembershipEmailCheckResult = {
  available: boolean;
  message?: string;
  status?: MembershipApplicationStatus;
  /** True when the applicant may re-submit the form and continue to payment. */
  resumable?: boolean;
  applicationId?: string;
};

/** Statuses where the public form may update the existing row and retry payment. */
export const RESUMABLE_MEMBERSHIP_STATUSES: MembershipApplicationStatus[] = ["pending_payment"];

export function isResumableMembershipStatus(status: MembershipApplicationStatus): boolean {
  return RESUMABLE_MEMBERSHIP_STATUSES.includes(status);
}

export function membershipEmailBlockMessage(
  status: MembershipApplicationStatus,
  memberId: string | null
): string {
  switch (status) {
    case "approved":
      return memberId
        ? `This email is already registered. Sign in with your member ID (${memberId}) or contact the secretariat.`
        : "This email is already registered as an approved member. Contact the secretariat.";
    case "payment_submitted":
      return "An application with this email is awaiting secretariat approval. You will receive a member ID by email when approved — no need to apply again.";
    case "pending_payment":
      return "An application with this email is already in progress. Complete payment on that application or contact the secretariat if you need help.";
    case "rejected":
      return "A previous application with this email was not approved. Contact the secretariat before applying again.";
    default:
      return "This email is already associated with a membership application.";
  }
}

function statusMessage(status: MembershipApplicationStatus, memberId: string | null): string {
  return membershipEmailBlockMessage(status, memberId);
}

async function queryActiveMembershipByEmail(email: string): Promise<MembershipApplication | null> {
  return prisma.membershipApplication.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      status: { not: "rejected" },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Latest non-rejected application for this email, if any. */
export async function findActiveMembershipByEmail(
  emailInput: string
): Promise<MembershipApplication | null> {
  const email = normalizeMembershipEmail(emailInput);
  if (!email) return null;

  if (!(await prismaReady())) {
    throw new Error(databaseUnavailableMessage());
  }

  try {
    return await queryActiveMembershipByEmail(email);
  } catch (error) {
    if (process.env.NODE_ENV !== "production" && isDbConnectionError(error)) {
      resetPrismaClient();
      if (await prismaReady()) {
        return queryActiveMembershipByEmail(email);
      }
    }
    throw error;
  }
}

export async function checkMembershipEmailAvailable(
  emailInput: string
): Promise<MembershipEmailCheckResult> {
  const email = normalizeMembershipEmail(emailInput);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { available: false, message: "Enter a valid email address." };
  }

  try {
    const existing = await findActiveMembershipByEmail(email);
    if (!existing) {
      return { available: true };
    }

    if (isResumableMembershipStatus(existing.status)) {
      return {
        available: true,
        resumable: true,
        status: existing.status,
        applicationId: existing.id,
      };
    }

    return {
      available: false,
      status: existing.status,
      message: statusMessage(existing.status, existing.memberId),
    };
  } catch (error) {
    if (isDbConnectionError(error)) {
      return { available: false, message: databaseUnavailableMessage() };
    }
    throw error;
  }
}
