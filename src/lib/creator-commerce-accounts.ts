import { prisma } from "@/lib/prisma";

export type CreatorAccountKind = "license" | "rental";

export type CreatorAccountAssignmentMetadata = {
  commerceType?: CreatorAccountKind;
  offerId?: string;
  assignedAccountId?: string;
  assignedAccountKind?: CreatorAccountKind;
  assignedAccountStatus?: string;
  [key: string]: unknown;
};

export async function assignCreatorAccountToUser({
  metadata,
  notificationId,
}: {
  metadata: CreatorAccountAssignmentMetadata;
  notificationId: string;
}) {
  const userId = typeof metadata.userId === "string" ? metadata.userId : "";
  const offerId = typeof metadata.offerId === "string" ? metadata.offerId : "";
  const now = new Date();

  if (!userId || !offerId || metadata.assignedAccountId) {
    return metadata;
  }

  if (metadata.commerceType === "license") {
    const account = await prisma.creatorLicenseAccount.findFirst({
      where: {
        offerId,
        isActive: true,
        OR: [
          { assignedToId: null },
          { assignedExpiresAt: { lt: now } },
        ],
      },
      include: {
        offer: {
          include: { plan: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (!account) {
      return {
        ...metadata,
        assignedAccountKind: "license",
        assignedAccountStatus: "sin_cuentas_disponibles",
      };
    }

    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + account.offer.plan.durationMonths);

    await prisma.creatorLicenseAccount.update({
      where: { id: account.id },
      data: {
        assignedToId: userId,
        assignedAt: now,
        assignedExpiresAt: expiresAt,
        purchaseNotificationId: notificationId,
      },
    });

    return {
      ...metadata,
      assignedAccountId: account.id,
      assignedAccountKind: "license",
      assignedAccountStatus: "asignada",
      assignedAccountExpiresAt: expiresAt.toISOString(),
    };
  }

  if (metadata.commerceType === "rental") {
    const account = await prisma.creatorRentalAccount.findFirst({
      where: {
        offerId,
        isActive: true,
        OR: [
          { assignedToId: null },
          { assignedExpiresAt: { lt: now } },
        ],
      },
      include: {
        offer: {
          include: { plan: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (!account) {
      return {
        ...metadata,
        assignedAccountKind: "rental",
        assignedAccountStatus: "sin_cuentas_disponibles",
      };
    }

    const expiresAt = new Date(
      now.getTime() + account.offer.plan.durationMonths * 60 * 60 * 1000
    );

    await prisma.creatorRentalAccount.update({
      where: { id: account.id },
      data: {
        assignedToId: userId,
        assignedAt: now,
        assignedExpiresAt: expiresAt,
        purchaseNotificationId: notificationId,
      },
    });

    return {
      ...metadata,
      assignedAccountId: account.id,
      assignedAccountKind: "rental",
      assignedAccountStatus: "asignada",
      assignedAccountExpiresAt: expiresAt.toISOString(),
    };
  }

  return metadata;
}
