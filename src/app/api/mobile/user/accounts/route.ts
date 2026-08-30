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

  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const [licenseAccounts, rentalAccounts] = await Promise.all([
    prisma.creatorLicenseAccount.findMany({
      where: { assignedToId: user.id },
      orderBy: [{ assignedExpiresAt: "asc" }, { assignedAt: "desc" }],
      include: {
        offer: {
          include: {
            product: { select: { id: true, name: true, imageUrl: true } },
            plan: { select: { id: true, name: true, durationMonths: true } },
          },
        },
      },
    }),
    prisma.creatorRentalAccount.findMany({
      where: { assignedToId: user.id },
      orderBy: [{ assignedExpiresAt: "asc" }, { assignedAt: "desc" }],
      include: {
        offer: {
          include: {
            tool: { select: { id: true, name: true, imageUrl: true } },
            plan: { select: { id: true, name: true, durationMonths: true } },
          },
        },
      },
    }),
  ]);

  const now = Date.now();
  const accounts = [
    ...licenseAccounts.map((account) => ({
      id: account.id,
      type: "license",
      itemId: account.offer.product.id,
      itemName: account.offer.product.name,
      imageUrl: account.offer.product.imageUrl,
      planId: account.offer.plan.id,
      planName: account.offer.plan.name,
      durationLabel: `${account.offer.plan.durationMonths} mes${
        account.offer.plan.durationMonths === 1 ? "" : "es"
      }`,
      username: account.username,
      password: account.password,
      note: account.note,
      assignedAt: account.assignedAt?.toISOString() ?? null,
      expiresAt: account.assignedExpiresAt?.toISOString() ?? null,
      remaining: remainingText(account.assignedExpiresAt),
      status:
        account.assignedExpiresAt && account.assignedExpiresAt.getTime() <= now
          ? "expired"
          : "active",
    })),
    ...rentalAccounts.map((account) => ({
      id: account.id,
      type: "rental",
      itemId: account.offer.tool.id,
      itemName: account.offer.tool.name,
      imageUrl: account.offer.tool.imageUrl,
      planId: account.offer.plan.id,
      planName: account.offer.plan.name,
      durationLabel: `${account.offer.plan.durationMonths} hora${
        account.offer.plan.durationMonths === 1 ? "" : "s"
      }`,
      username: account.username,
      password: account.password,
      note: account.note,
      assignedAt: account.assignedAt?.toISOString() ?? null,
      expiresAt: account.assignedExpiresAt?.toISOString() ?? null,
      remaining: remainingText(account.assignedExpiresAt),
      status:
        account.assignedExpiresAt && account.assignedExpiresAt.getTime() <= now
          ? "expired"
          : "active",
    })),
  ].sort((first, second) => {
    if (first.status !== second.status) return first.status === "active" ? -1 : 1;
    const firstTime = first.expiresAt ? Date.parse(first.expiresAt) : 0;
    const secondTime = second.expiresAt ? Date.parse(second.expiresAt) : 0;
    return firstTime - secondTime;
  });

  return NextResponse.json({ accounts });
}
