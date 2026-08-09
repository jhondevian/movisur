import { requireAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const notificationWhere =
    user.role === "creador"
      ? { recipientUserId: user.id }
      : { recipientUserId: null };

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
    user.role === "creador"
      ? "/creador/compras"
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
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const notificationWhere =
    user.role === "creador"
      ? { recipientUserId: user.id }
      : { recipientUserId: null };

  await prisma.adminNotification.updateMany({
    where: { ...notificationWhere, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
