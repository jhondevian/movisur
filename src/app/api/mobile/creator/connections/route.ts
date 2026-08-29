import { verifyMobileAuth } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function remainingText(expiresAt: Date | null) {
  if (!expiresAt) return null;

  const ms = expiresAt.getTime() - Date.now();
  if (ms <= 0) return "Vencido";

  const minutes = Math.ceil(ms / 60_000);
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.ceil(minutes / 60);
  if (hours < 48) return `${hours} h`;

  return `${Math.ceil(hours / 24)} dias`;
}

export async function GET(request: NextRequest) {
  const user = await verifyMobileAuth(request);

  if (!user || user.role !== "creador") {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const [licenseOffers, rentalOffers] = await Promise.all([
    prisma.creatorLicenseOffer.findMany({
      where: { creatorId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        product: { select: { id: true, name: true, imageUrl: true } },
        plan: { select: { id: true, name: true, durationMonths: true } },
        accounts: {
          orderBy: [{ assignedAt: "desc" }, { createdAt: "desc" }],
          include: { assignedTo: { select: { firstName: true, lastName: true, email: true } } },
        },
      },
    }),
    prisma.creatorRentalOffer.findMany({
      where: { creatorId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        tool: { select: { id: true, name: true, imageUrl: true } },
        plan: { select: { id: true, name: true, durationMonths: true } },
        accounts: {
          orderBy: [{ assignedAt: "desc" }, { createdAt: "desc" }],
          include: { assignedTo: { select: { firstName: true, lastName: true, email: true } } },
        },
      },
    }),
  ]);

  const groups = [
    ...licenseOffers.map((offer) => ({
      id: offer.id,
      type: "license",
      itemId: offer.product.id,
      itemName: offer.product.name,
      imageUrl: offer.product.imageUrl,
      planId: offer.plan.id,
      planName: offer.plan.name,
      durationLabel: `${offer.plan.durationMonths} mes${
        offer.plan.durationMonths === 1 ? "" : "es"
      }`,
      accountCount: offer.accounts.length,
      availableCount: offer.accounts.filter((account) => !account.assignedToId).length,
      assignedCount: offer.accounts.filter((account) => account.assignedToId).length,
      accounts: offer.accounts.map((account) => ({
        id: account.id,
        username: account.username,
        password: account.password,
        note: account.note,
        isActive: account.isActive,
        assignedToName: account.assignedTo
          ? `${account.assignedTo.firstName} ${account.assignedTo.lastName}`.trim()
          : null,
        assignedToEmail: account.assignedTo?.email ?? null,
        assignedAt: account.assignedAt?.toISOString() ?? null,
        expiresAt: account.assignedExpiresAt?.toISOString() ?? null,
        remaining: remainingText(account.assignedExpiresAt),
        status: account.assignedTo ? "assigned" : "available",
      })),
    })),
    ...rentalOffers.map((offer) => ({
      id: offer.id,
      type: "rental",
      itemId: offer.tool.id,
      itemName: offer.tool.name,
      imageUrl: offer.tool.imageUrl,
      planId: offer.plan.id,
      planName: offer.plan.name,
      durationLabel: `${offer.plan.durationMonths} hora${
        offer.plan.durationMonths === 1 ? "" : "s"
      }`,
      accountCount: offer.accounts.length,
      availableCount: offer.accounts.filter((account) => !account.assignedToId).length,
      assignedCount: offer.accounts.filter((account) => account.assignedToId).length,
      accounts: offer.accounts.map((account) => ({
        id: account.id,
        username: account.username,
        password: account.password,
        note: account.note,
        isActive: account.isActive,
        assignedToName: account.assignedTo
          ? `${account.assignedTo.firstName} ${account.assignedTo.lastName}`.trim()
          : null,
        assignedToEmail: account.assignedTo?.email ?? null,
        assignedAt: account.assignedAt?.toISOString() ?? null,
        expiresAt: account.assignedExpiresAt?.toISOString() ?? null,
        remaining: remainingText(account.assignedExpiresAt),
        status: account.assignedTo ? "assigned" : "available",
      })),
    })),
  ];

  return NextResponse.json({ connections: groups });
}
