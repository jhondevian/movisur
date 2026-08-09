import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function requireCreatorSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) return null;

  try {
    const user = await verifyAuthToken(token);
    if (user.role !== "creador" && user.role !== "admin") return null;
    return user;
  } catch {
    return null;
  }
}

export async function ensureCreatorLicenseOffer({
  creatorId,
  productId,
  planId,
}: {
  creatorId: string;
  productId: string;
  planId: string;
}) {
  const plan = await prisma.creatorLicensePlan.findFirst({
    where: {
      id: planId,
      productId,
      isActive: true,
      product: { isActive: true },
    },
  });

  if (!plan) return null;

  return prisma.creatorLicenseOffer.upsert({
    where: {
      creatorId_planId: {
        creatorId,
        planId,
      },
    },
    update: {
      productId,
    },
    create: {
      creatorId,
      productId,
      planId,
      price: plan.price,
      currency: plan.currency,
      isActive: false,
    },
  });
}

export async function ensureCreatorRentalOffer({
  creatorId,
  toolId,
  planId,
}: {
  creatorId: string;
  toolId: string;
  planId: string;
}) {
  const plan = await prisma.creatorRentalPlan.findFirst({
    where: {
      id: planId,
      toolId,
      isActive: true,
      tool: { isActive: true },
    },
  });

  if (!plan) return null;

  return prisma.creatorRentalOffer.upsert({
    where: {
      creatorId_planId: {
        creatorId,
        planId,
      },
    },
    update: {
      toolId,
    },
    create: {
      creatorId,
      toolId,
      planId,
      price: plan.price,
      currency: plan.currency,
      isActive: false,
    },
  });
}
