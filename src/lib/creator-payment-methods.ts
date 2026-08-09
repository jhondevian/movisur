import { defaultPaymentMethods } from "@/lib/movisur-commerce";
import { prisma } from "@/lib/prisma";

export const creatorAllowedPaymentCodes = ["binance", "transferencia"] as const;
export type CreatorAllowedPaymentCode =
  (typeof creatorAllowedPaymentCodes)[number];

export function isCreatorPaymentCode(
  code: string
): code is CreatorAllowedPaymentCode {
  return creatorAllowedPaymentCodes.some((allowedCode) => allowedCode === code);
}

const creatorPaymentMethods = defaultPaymentMethods
  .filter((method) => isCreatorPaymentCode(method.code))
  .map((method) =>
    method.code === "transferencia" ? { ...method, name: "Yape" } : method
  );

export async function ensureCreatorPaymentMethods(creatorId: string) {
  await Promise.all(
    creatorPaymentMethods.map((method) =>
      prisma.creatorPaymentMethod.upsert({
        where: {
          creatorId_code: {
            creatorId,
            code: method.code,
          },
        },
        update: {
          name: method.name,
          sortOrder: method.sortOrder,
        },
        create: {
          creatorId,
          code: method.code,
          name: method.name,
          sortOrder: method.sortOrder,
          details: "",
          isEnabled: false,
        },
      })
    )
  );

  return prisma.creatorPaymentMethod.findMany({
    where: {
      creatorId,
      code: { in: [...creatorAllowedPaymentCodes] },
    },
    orderBy: { sortOrder: "asc" },
  });
}
