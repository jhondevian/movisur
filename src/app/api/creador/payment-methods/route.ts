import type { PaymentMethodCode } from "@/generated/prisma/client";
import {
  creatorAllowedPaymentCodes,
  isCreatorPaymentCode,
} from "@/lib/creator-payment-methods";
import { requireCreatorSession } from "@/lib/creator-commerce-offer-auth";
import { defaultPaymentMethods } from "@/lib/movisur-commerce";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type PaymentMethodPayload = {
  code: PaymentMethodCode;
  details?: string;
  isEnabled?: boolean;
};

export async function POST(request: NextRequest) {
  const user = await requireCreatorSession();
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as {
    methods?: PaymentMethodPayload[];
  } | null;

  if (!payload?.methods) {
    return NextResponse.json(
      { message: "No se recibieron metodos de pago." },
      { status: 400 }
    );
  }

  const updates = payload.methods.filter((method) =>
    isCreatorPaymentCode(method.code)
  );

  await Promise.all(
    updates.map((method) => {
      const defaults = defaultPaymentMethods.find(
        (item) => item.code === method.code
      );
      const name =
        method.code === "transferencia"
          ? "Yape"
          : defaults?.name ?? method.code;

      return prisma.creatorPaymentMethod.upsert({
        where: {
          creatorId_code: {
            creatorId: user.id,
            code: method.code,
          },
        },
        update: {
          details: method.details ?? "",
          isEnabled: Boolean(method.isEnabled),
          name,
          sortOrder: defaults?.sortOrder ?? 99,
        },
        create: {
          creatorId: user.id,
          code: method.code,
          name,
          sortOrder: defaults?.sortOrder ?? 99,
          details: method.details ?? "",
          isEnabled: Boolean(method.isEnabled),
        },
      });
    })
  );

  const paymentMethods = await prisma.creatorPaymentMethod.findMany({
    where: {
      creatorId: user.id,
      code: { in: [...creatorAllowedPaymentCodes] },
    },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ paymentMethods });
}
