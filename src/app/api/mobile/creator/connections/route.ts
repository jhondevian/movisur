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

  const [licenseAccounts, rentalAccounts] = await Promise.all([
    prisma.creatorLicenseAccount.findMany({
      where: { creatorId: user.id },
      orderBy: [{ assignedAt: "desc" }, { createdAt: "desc" }],
      take: 100,
      select: {
        id: true,
        username: true,
        password: true,
        note: true,
        isActive: true,
        assignedAt: true,
        assignedExpiresAt: true,
        assignedTo: {
          select: { firstName: true, lastName: true, email: true },
        },
        offer: {
          select: {
            product: { select: { name: true } },
            plan: { select: { name: true, durationMonths: true } },
          },
        },
      },
    }),
    prisma.creatorRentalAccount.findMany({
      where: { creatorId: user.id },
      orderBy: [{ assignedAt: "desc" }, { createdAt: "desc" }],
      take: 100,
      select: {
        id: true,
        username: true,
        password: true,
        note: true,
        isActive: true,
        assignedAt: true,
        assignedExpiresAt: true,
        assignedTo: {
          select: { firstName: true, lastName: true, email: true },
        },
        offer: {
          select: {
            tool: { select: { name: true } },
            plan: { select: { name: true, durationMonths: true } },
          },
        },
      },
    }),
  ]);

  const connections = [
    ...licenseAccounts.map((account) => ({
      id: account.id,
      type: "license",
      itemName: account.offer.product.name,
      planName: account.offer.plan.name,
      durationLabel: `${account.offer.plan.durationMonths} mes${
        account.offer.plan.durationMonths === 1 ? "" : "es"
      }`,
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
    ...rentalAccounts.map((account) => ({
      id: account.id,
      type: "rental",
      itemName: account.offer.tool.name,
      planName: account.offer.plan.name,
      durationLabel: `${account.offer.plan.durationMonths} hora${
        account.offer.plan.durationMonths === 1 ? "" : "s"
      }`,
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
  ];

  return NextResponse.json({ connections });
}
