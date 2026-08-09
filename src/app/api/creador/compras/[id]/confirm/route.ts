import { assignCreatorAccountToUser } from "@/lib/creator-commerce-accounts";
import { requireCreatorSession } from "@/lib/creator-commerce-offer-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type PaymentMetadata = {
  purchaseStatus?: string;
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
    return NextResponse.json({ ok: true });
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
    data: {
      isRead: true,
      metadata: JSON.stringify(updatedMetadata),
    },
  });

  return NextResponse.json({ ok: true });
}
