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

function canManageNotification(
  user: { id: string; role: UserRole },
  notification: { recipientUserId: string | null }
) {
  if (user.role === "admin" || user.role === "moderador") {
    return notification.recipientUserId === null || notification.recipientUserId === user.id;
  }

  return notification.recipientUserId === user.id;
}

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getPanelUser();
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const notification = await prisma.adminNotification.findUnique({
    where: { id },
    select: { recipientUserId: true },
  });

  if (!notification || !canManageNotification(user, notification)) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  await prisma.adminNotification.update({
    where: { id },
    data: { archivedAt: new Date(), isRead: true },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getPanelUser();
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const notification = await prisma.adminNotification.findUnique({
    where: { id },
    select: { recipientUserId: true },
  });

  if (!notification || !canManageNotification(user, notification)) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  await prisma.adminNotification.update({
    where: { id },
    data: { deletedAt: new Date(), isRead: true },
  });

  return NextResponse.json({ ok: true });
}
