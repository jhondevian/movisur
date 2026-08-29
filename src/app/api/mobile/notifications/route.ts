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
  const notificationIds = notifications.map((notification) => notification.id);
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
    notifications: notifications.map((notification) => ({
      ...notification,
      createdAt: notification.createdAt.toISOString(),
      metadata: notification.metadata
        ? (() => {
            try {
              return JSON.parse(notification.metadata || "{}");
            } catch {
              return {};
            }
          })()
        : {},
      access: accountsByNotificationId.get(notification.id) ?? null,
    })),
    unreadCount,
    role: user.role,
  });
}
