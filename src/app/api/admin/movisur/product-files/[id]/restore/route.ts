import { requireAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

async function hasConfirmedPurchase(userId: string) {
  const purchases = await prisma.adminNotification.findMany({
    where: {
      type: "binance_payment_confirmation",
      metadata: {
        contains: `"userId":"${userId}"`,
      },
      AND: [
        {
          metadata: {
            contains: `"purchaseStatus":"confirmed"`,
          },
        },
      ],
    },
    select: {
      createdAt: true,
      metadata: true,
    },
  });

  return purchases.some((purchase) => {
    let metadata: {
      confirmedAt?: string;
      durationMonths?: number;
      purchaseStatus?: string;
    } = {};

    try {
      metadata = JSON.parse(purchase.metadata || "{}");
    } catch {
      return false;
    }

    if (metadata.purchaseStatus !== "confirmed") return false;

    const months = Number(metadata.durationMonths || 0);
    if (months <= 0) return true;

    const start = metadata.confirmedAt
      ? new Date(metadata.confirmedAt)
      : purchase.createdAt;
    const expiresAt = new Date(start);
    expiresAt.setMonth(expiresAt.getMonth() + months);

    return expiresAt.getTime() >= Date.now();
  });
}

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const currentFile = await prisma.movisurProductFile.findUnique({
    where: { id },
    select: {
      id: true,
      createdById: true,
      deletedAt: true,
    },
  });

  if (!currentFile) {
    return NextResponse.json(
      { message: "El archivo no existe." },
      { status: 404 }
    );
  }

  if (user.role === "creador" && currentFile.createdById !== user.id) {
    return NextResponse.json(
      { message: "No puedes recuperar archivos de otro usuario." },
      { status: 403 }
    );
  }

  if (user.role === "creador") {
    const canRestore = await hasConfirmedPurchase(user.id);

    if (!canRestore) {
      return NextResponse.json(
        { message: "Necesitas un plan activo para recuperar archivos." },
        { status: 402 }
      );
    }
  }

  const restored = await prisma.movisurProductFile.update({
    where: { id },
    data: {
      deletedAt: null,
      deletedById: null,
      isActive: true,
    },
  });

  return NextResponse.json({ file: restored });
}
