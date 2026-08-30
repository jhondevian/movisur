import { verifyMobileAuth } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function getNotificationWhere(user: { id: string; role: string }) {
  if (user.role === "admin" || user.role === "moderador") {
    return {
      OR: [{ recipientUserId: null }, { recipientUserId: user.id }],
      type: { in: ["binance_payment_confirmation", "payment_confirmed"] },
    };
  }

  return {
    recipientUserId: user.id,
    type: { in: ["binance_payment_confirmation", "payment_confirmed"] },
  };
}

function parseMetadata(metadata: string | null) {
  if (!metadata) return {};

  try {
    return JSON.parse(metadata || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function GET(request: NextRequest) {
  const user = await verifyMobileAuth(request);

  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const notificationWhere = getNotificationWhere(user);
  const [notifications, unreadCount] = await Promise.all([
    prisma.adminNotification.findMany({
      where: notificationWhere,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        metadata: true,
        isRead: true,
        createdAt: true,
      },
    }),
    prisma.adminNotification.count({
      where: { ...notificationWhere, isRead: false },
    }),
  ]);
  const parsedNotifications = notifications.map((notification) => ({
    ...notification,
    metadata: parseMetadata(notification.metadata),
  }));
  const notificationIds = notifications.map((notification) => notification.id);
  const buyerIds = [
    ...new Set(
      parsedNotifications
        .map((notification) => notification.metadata.userId)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    ),
  ];
  const [licenseAccounts, rentalAccounts] =
    user.role === "usuario" && notificationIds.length > 0
      ? await Promise.all([
          prisma.creatorLicenseAccount.findMany({
            where: {
              assignedToId: user.id,
              purchaseNotificationId: { in: notificationIds },
            },
            select: {
              purchaseNotificationId: true,
              username: true,
              password: true,
              note: true,
              assignedExpiresAt: true,
            },
          }),
          prisma.creatorRentalAccount.findMany({
            where: {
              assignedToId: user.id,
              purchaseNotificationId: { in: notificationIds },
            },
            select: {
              purchaseNotificationId: true,
              username: true,
              password: true,
              note: true,
              assignedExpiresAt: true,
            },
          }),
        ])
      : [[], []];
  const buyers =
    buyerIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: buyerIds } },
          select: { id: true, avatarUrl: true },
        })
      : [];
  const buyerAvatarById = new Map(
    buyers.map((buyer) => [buyer.id, buyer.avatarUrl])
  );
  const accountsByNotificationId = new Map(
    [...licenseAccounts, ...rentalAccounts]
      .filter((account) => account.purchaseNotificationId)
      .map((account) => [
        account.purchaseNotificationId,
        {
          username: account.username,
          password: account.password,
          note: account.note,
          expiresAt: account.assignedExpiresAt?.toISOString() ?? null,
        },
      ])
  );

  return NextResponse.json({
    notifications: parsedNotifications.map((notification) => ({
      ...notification,
      createdAt: notification.createdAt.toISOString(),
      metadata: {
        ...notification.metadata,
        userAvatarUrl:
          typeof notification.metadata.userAvatarUrl === "string"
            ? notification.metadata.userAvatarUrl
            : typeof notification.metadata.userId === "string"
            ? buyerAvatarById.get(notification.metadata.userId) ?? null
            : null,
      },
      access: accountsByNotificationId.get(notification.id) ?? null,
    })),
    unreadCount,
    role: user.role,
  });
}
