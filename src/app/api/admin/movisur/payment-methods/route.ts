import { requireAdminUser } from "@/lib/admin-auth";
import { defaultPaymentMethods } from "@/lib/movisur-commerce";
import { prisma } from "@/lib/prisma";
import type { PaymentMethodCode } from "@/generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const paymentCodes = defaultPaymentMethods.map((method) => method.code);

type PaymentMethodPayload = {
  code: PaymentMethodCode;
  details?: string;
  isEnabled?: boolean;
};

export async function POST(request: NextRequest) {
  const user = await requireAdminUser();
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
    paymentCodes.includes(method.code)
  );

  await Promise.all(
    updates.map((method) => {
      const defaults = defaultPaymentMethods.find(
        (item) => item.code === method.code
      );

      return prisma.movisurPaymentMethod.upsert({
        where: { code: method.code },
        update: {
          details: method.details ?? "",
          isEnabled: Boolean(method.isEnabled),
        },
        create: {
          code: method.code,
          name: defaults?.name ?? method.code,
          sortOrder: defaults?.sortOrder ?? 99,
          details: method.details ?? "",
          isEnabled: Boolean(method.isEnabled),
        },
      });
    })
  );

  const paymentMethods = await prisma.movisurPaymentMethod.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ paymentMethods });
}
