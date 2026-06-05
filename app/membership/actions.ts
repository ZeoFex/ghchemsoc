"use server";

import { prisma, prismaReady } from "@/lib/prisma";
import { databaseUnavailableMessage } from "@/lib/db-fallback";
import { MEMBERSHIP_FEE_GHS } from "@/lib/membership-application";
import {
    findActiveMembershipByEmail,
    isResumableMembershipStatus,
    membershipEmailBlockMessage,
} from "@/lib/membership-email-check";
import { processMembershipPhotoFile } from "@/lib/membership-photo";
import { prismaSaveErrorMessage } from "@/lib/prisma-errors";

export type CreateMembershipApplicationState =
    | { ok: true; applicationId: string; amountGhs: number; resumed?: boolean }
    | { ok: false; message: string };

function trim(formData: FormData, key: string): string {
    const v = formData.get(key);
    return typeof v === "string" ? v.trim() : "";
}

export async function createMembershipApplication(
    formData: FormData
): Promise<CreateMembershipApplicationState> {
    const fullName = trim(formData, "fullName");
    const email = trim(formData, "email");
    const phone = trim(formData, "phone");
    const institution = trim(formData, "institution");
    const jobTitle = trim(formData, "jobTitle");
    const highestDegree = trim(formData, "highestDegree");
    const declarationLegalName = trim(formData, "declarationLegalName");
    const declarationDate = trim(formData, "declarationDate");

    if (!fullName) {
        return { ok: false, message: "Enter your full name as it should appear on your certificate." };
    }
    if (!institution) {
        return { ok: false, message: "Place of work / institution is required." };
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { ok: false, message: "Enter a valid email address." };
    }

    if (phone && phone.replace(/\D/g, "").length < 9) {
        return { ok: false, message: "Enter a valid phone number or leave the field blank." };
    }
    if (!declarationLegalName) {
        return {
            ok: false,
            message: "Enter your full legal name (surname last) to consent to the declaration.",
        };
    }
    if (!declarationDate || Number.isNaN(Date.parse(declarationDate))) {
        return { ok: false, message: "Enter the declaration date." };
    }

    let photoUrl: string | undefined;
    let photoPublicId: string | undefined;

    const photo = formData.get("photo");
    if (photo instanceof File && photo.size > 0) {
        try {
            const uploaded = await processMembershipPhotoFile(photo);
            photoUrl = uploaded.photoUrl;
            photoPublicId = uploaded.photoPublicId;
        } catch (e) {
            const message = e instanceof Error ? e.message : "Could not upload your photo.";
            return { ok: false, message };
        }
    }

    if (!(await prismaReady())) {
        return { ok: false, message: databaseUnavailableMessage() };
    }

    try {
        const normalizedEmail = email.toLowerCase();
        const existing = await findActiveMembershipByEmail(normalizedEmail);

        if (existing && !isResumableMembershipStatus(existing.status)) {
            return {
                ok: false,
                message: membershipEmailBlockMessage(existing.status, existing.memberId),
            };
        }

        const applicationData = {
            fullName,
            email: normalizedEmail,
            phone: phone || null,
            institution,
            jobTitle: jobTitle || null,
            highestDegree: highestDegree || null,
            declarationLegalName,
            declarationDate,
            ...(photoUrl !== undefined ? { photoUrl: photoUrl ?? null, photoPublicId: photoPublicId ?? null } : {}),
        };

        if (existing) {
            const row = await prisma.membershipApplication.update({
                where: { id: existing.id },
                data: {
                    ...applicationData,
                    status: "pending_payment",
                    amountGhs: MEMBERSHIP_FEE_GHS,
                    paymentStatus: "pending",
                    paymentMethod: null,
                    paystackReference: null,
                    payerPhone: null,
                    paymentNote: null,
                    paidAt: null,
                    read: false,
                },
            });

            return { ok: true, applicationId: row.id, amountGhs: row.amountGhs, resumed: true };
        }

        const row = await prisma.membershipApplication.create({
            data: {
                ...applicationData,
                status: "pending_payment",
                photoUrl: photoUrl ?? null,
                photoPublicId: photoPublicId ?? null,
                amountGhs: MEMBERSHIP_FEE_GHS,
                paymentStatus: "pending",
                read: false,
            },
        });

        return { ok: true, applicationId: row.id, amountGhs: row.amountGhs };
    } catch (e) {
        console.error("[createMembershipApplication]", e);
        return { ok: false, message: prismaSaveErrorMessage(e, "save your application") };
    }
}
