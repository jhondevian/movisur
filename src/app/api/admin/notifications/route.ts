import { authCookieName, verifyAuthToken } from "@/lib/auth";
import type { UserRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

async function getPanelUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) return null;

  try {
    return await verifyAuthToken(token);
  } catch {
    return null;
  }
}

function getNotificationWhere(user: { id: string; role: UserRole }) {
  if (user.role === "admin" || user.role === "moderador") {
    return {
      OR: [{ recipientUserId: null }, { recipientUserId: user.id }],
    };
  }

  return { recipientUserId: user.id };
}

export async function GET() {
  const user = await getPanelUser();
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const notificationWhere = getNotificationWhere(user);

  const [notifications, unreadCount] = await Promise.all([
    prisma.adminNotification.findMany({
      where: notificationWhere,
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.adminNotification.count({
      where: { ...notificationWhere, isRead: false },
    }),
  ]);

  const firstNotification = notifications[0];
  const targetHref =
    firstNotification?.type === "payment_confirmed"
      ? "/usuario/compras"
      : user.role === "creador"
      ? "/creador/compras"
      : user.role === "usuario"
      ? "/usuario/compras"
      : firstNotification?.type === "creator_access_request"
      ? "/admin/creadores/solicitudes"
      : "/admin/compras";

  return NextResponse.json({
    notifications,
    unreadCount,
    targetHref,
  });
}

export async function PATCH() {
  const user = await getPanelUser();
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const notificationWhere = getNotificationWhere(user);

  await prisma.adminNotification.updateMany({
    where: { ...notificationWhere, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
