import { assignCreatorAccountToUser } from "@/lib/creator-commerce-accounts";
import { verifyMobileAuth } from "@/lib/mobile-auth";
import { sendPushToUsers } from "@/lib/mobile-push";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type PaymentMetadata = {
  purchaseStatus?: string;
  currency?: string;
  itemName?: string;
  planName?: string;
  price?: string;
  userId?: string;
  [key: string]: unknown;
};

function parseMetadata(metadata: string | null): PaymentMetadata {
  if (!metadata) return {};
  try {
    return JSON.parse(metadata) as PaymentMetadata;
  } catch {
    return {};
  }
}

async function notifyBuyerPaymentConfirmed(
  purchaseId: string,
  metadata: PaymentMetadata
) {
  if (!metadata.userId) return;

  const existingNotification = await prisma.adminNotification.findFirst({
    where: {
      type: "payment_confirmed",
      recipientUserId: metadata.userId,
      metadata: { contains: `"purchaseNotificationId":"${purchaseId}"` },
    },
    select: { id: true },
  });
  if (existingNotification) return;

  const itemName = metadata.itemName || metadata.planName || "Movisur";
  const priceText =
    metadata.price && metadata.currency
      ? ` (${metadata.currency} ${metadata.price})`
      : "";

  await prisma.adminNotification.create({
    data: {
      type: "payment_confirmed",
      recipientUserId: metadata.userId,
      title: "Pago confirmado",
      message: `${itemName}${priceText} ya fue aprobado.`,
      metadata: JSON.stringify({
        purchaseNotificationId: purchaseId,
        itemName,
        planName: metadata.planName,
        price: metadata.price,
        currency: metadata.currency,
      }),
    },
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await verifyMobileAuth(request);
  if (!user || user.role !== "creador") {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const purchase = await prisma.adminNotification.findFirst({
    where: {
      id,
      type: "binance_payment_confirmation",
      recipientUserId: user.id,
    },
  });

  if (!purchase) {
    return NextResponse.json(
      { message: "La solicitud no existe." },
      { status: 404 }
    );
  }

  const metadata = parseMetadata(purchase.metadata);
  if (metadata.purchaseStatus === "confirmed") {
    return NextResponse.json({ ok: true });
  }
  if (metadata.purchaseStatus === "rejected") {
    return NextResponse.json(
      { message: "La compra ya fue rechazada." },
      { status: 409 }
    );
  }

  const updatedMetadata = await assignCreatorAccountToUser({
    metadata: {
      ...metadata,
      purchaseStatus: "confirmed",
      confirmedAt: new Date().toISOString(),
      confirmedById: user.id,
      confirmedByName: `${user.firstName} ${user.lastName}`.trim(),
      confirmedByEmail: user.email,
    },
    notificationId: purchase.id,
  });

  await prisma.adminNotification.update({
    where: { id: purchase.id },
    data: { isRead: true, metadata: JSON.stringify(updatedMetadata) },
  });

  await notifyBuyerPaymentConfirmed(purchase.id, updatedMetadata);
  if (updatedMetadata.userId) {
    const itemName =
      updatedMetadata.itemName || updatedMetadata.planName || "Movisur";
    await sendPushToUsers([updatedMetadata.userId], {
      title: "Pago confirmado",
      body: `${itemName} ya fue aprobado.`,
      notificationId: purchase.id,
      route: "vaults",
      type: "payment_confirmed",
    });
  }

  return NextResponse.json({ ok: true });
}
