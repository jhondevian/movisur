import { prisma } from "@/lib/prisma";
import type { PaymentMethodCode } from "@/generated/prisma/client";

export const defaultPaymentMethods: {
  code: PaymentMethodCode;
  name: string;
  sortOrder: number;
}[] = [
  { code: "paypal", name: "PayPal", sortOrder: 1 },
  { code: "binance", name: "Binance", sortOrder: 2 },
  { code: "mercadopago", name: "MercadoPago", sortOrder: 3 },
  { code: "transferencia", name: "Transferencia", sortOrder: 4 },
];

const defaultSalePlans = [
  { name: "1 mes", durationMonths: 1, sortOrder: 1 },
  { name: "2 meses", durationMonths: 2, sortOrder: 2 },
  { name: "6 meses", durationMonths: 6, sortOrder: 3 },
  { name: "1 año", durationMonths: 12, sortOrder: 4 },
];

export async function ensureMovisurCommerceSettings() {
  const [saleSettings] = await Promise.all([
    prisma.movisurSaleSettings.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
        productName: "Movisur Tool",
        price: 0,
        currency: "USD",
        description: "Licencia de acceso a Movisur Tool.",
      },
    }),
    Promise.all(
      defaultPaymentMethods.map((method) =>
        prisma.movisurPaymentMethod.upsert({
          where: { code: method.code },
          update: {
            name: method.name,
            sortOrder: method.sortOrder,
          },
          create: {
            code: method.code,
            name: method.name,
            sortOrder: method.sortOrder,
          },
        })
      )
    ),
  ]);

  const existingPlans = await prisma.movisurSalePlan.count();
  if (existingPlans === 0) {
    await prisma.movisurSalePlan.createMany({
      data: defaultSalePlans.map((plan) => ({
        ...plan,
        price: 0,
      })),
    });
  }

  const paymentMethods = await prisma.movisurPaymentMethod.findMany({
    orderBy: { sortOrder: "asc" },
  });
  const salePlans = await prisma.movisurSalePlan.findMany({
    include: {
      includedItems: {
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return { saleSettings, paymentMethods, salePlans };
}
