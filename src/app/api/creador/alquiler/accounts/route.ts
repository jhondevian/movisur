import {
  ensureCreatorRentalOffer,
  requireCreatorSession,
} from "@/lib/creator-commerce-offer-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type AccountPayload = {
  itemId?: string;
  planId?: string;
  username?: string;
  password?: string;
  note?: string;
};

function getRentalExpiration(
  assignedAt: Date | null,
  assignedExpiresAt: Date | null,
  durationHours: number
) {
  if (assignedExpiresAt || !assignedAt) return assignedExpiresAt;

  return new Date(assignedAt.getTime() + durationHours * 60 * 60 * 1000);
}

export async function GET(request: NextRequest) {
  const user = await requireCreatorSession();
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const planId = request.nextUrl.searchParams.get("planId");
  if (!planId) {
    return NextResponse.json({ accounts: [] });
  }

  const offer = await prisma.creatorRentalOffer.findUnique({
    where: {
      creatorId_planId: {
        creatorId: user.id,
        planId,
      },
    },
    include: {
      plan: {
        select: {
          durationMonths: true,
        },
      },
      accounts: {
        orderBy: { createdAt: "desc" },
        include: {
          assignedTo: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  const accounts =
    offer?.accounts.map((account) => ({
      account,
      assignedExpiresAt: getRentalExpiration(
        account.assignedAt,
        account.assignedExpiresAt,
        offer.plan.durationMonths
      ),
    })) ?? [];

  await Promise.all(
    accounts
      .filter(
        ({ account, assignedExpiresAt }) =>
          account.assignedToId && !account.assignedExpiresAt && assignedExpiresAt
      )
      .map(({ account, assignedExpiresAt }) =>
        prisma.creatorRentalAccount.update({
          where: { id: account.id },
          data: { assignedExpiresAt },
        })
      )
  );

  return NextResponse.json({
    accounts: accounts.map(({ account, assignedExpiresAt }) => ({
        id: account.id,
        username: account.username,
        password: account.password,
        note: account.note,
        isActive: account.isActive,
        assignedAt: account.assignedAt,
        assignedExpiresAt,
        assignedTo: account.assignedTo
          ? {
              name: `${account.assignedTo.firstName} ${account.assignedTo.lastName}`.trim(),
              email: account.assignedTo.email,
            }
          : null,
      })),
  });
}

export async function POST(request: NextRequest) {
  const user = await requireCreatorSession();
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as
    | AccountPayload
    | null;

  if (!payload?.itemId || !payload.planId || !payload.username || !payload.password) {
    return NextResponse.json(
      { message: "Usuario y contrasena son obligatorios." },
      { status: 400 }
    );
  }

  const offer = await ensureCreatorRentalOffer({
    creatorId: user.id,
    toolId: payload.itemId,
    planId: payload.planId,
  });

  if (!offer) {
    return NextResponse.json(
      { message: "El plan de alquiler no existe." },
      { status: 404 }
    );
  }

  const account = await prisma.creatorRentalAccount.create({
    data: {
      creatorId: user.id,
      offerId: offer.id,
      username: payload.username.trim(),
      password: payload.password.trim(),
      note: payload.note?.trim() || null,
    },
  });

  return NextResponse.json({ account }, { status: 201 });
}
