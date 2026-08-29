import { requireCreatorSession } from "@/lib/creator-commerce-offer-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

async function notifyBuyerPaymentRejected(
  purchaseId: string,
  metadata: PaymentMetadata
) {
  if (!metadata.userId) return;

  const existingNotification = await prisma.adminNotification.findFirst({
    where: {
      type: "payment_rejected",
      recipientUserId: metadata.userId,
      metadata: {
        contains: `"purchaseNotificationId":"${purchaseId}"`,
      },
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
      type: "payment_rejected",
      recipientUserId: metadata.userId,
      title: "Pago rechazado",
      message: `${itemName}${priceText} fue rechazado. Revisa el comprobante enviado.`,
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
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireCreatorSession();
  if (!user) {
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
    return NextResponse.json(
      { message: "La compra ya fue confirmada." },
      { status: 409 }
    );
  }

  if (metadata.purchaseStatus === "rejected") {
    return NextResponse.json({ ok: true });
  }

  const updatedMetadata = {
    ...metadata,
    purchaseStatus: "rejected",
    rejectedAt: new Date().toISOString(),
    rejectedById: user.id,
    rejectedByName: `${user.firstName} ${user.lastName}`.trim(),
    rejectedByEmail: user.email,
  };

  await prisma.adminNotification.update({
    where: { id: purchase.id },
    data: {
      isRead: true,
      metadata: JSON.stringify(updatedMetadata),
    },
  });

  await notifyBuyerPaymentRejected(purchase.id, updatedMetadata);

  return NextResponse.json({ ok: true });
}
