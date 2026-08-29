import { ensureCreatorLicenseOffer, ensureCreatorRentalOffer } from "@/lib/creator-commerce-offer-auth";
import { verifyMobileAuth } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type Payload = {
  type?: "license" | "rental";
  itemId?: string;
  planId?: string;
  username?: string;
  password?: string;
  note?: string;
};

export async function POST(request: NextRequest) {
  const user = await verifyMobileAuth(request);
  if (!user || user.role !== "creador") {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as Payload | null;
  if (!payload?.type || !payload.itemId || !payload.planId || !payload.username || !payload.password) {
    return NextResponse.json({ message: "Completa tool, usuario y contrasena." }, { status: 400 });
  }

  if (payload.type === "license") {
    const offer = await ensureCreatorLicenseOffer({
      creatorId: user.id,
      productId: payload.itemId,
      planId: payload.planId,
    });
    if (!offer) return NextResponse.json({ message: "El plan no existe." }, { status: 404 });
    const account = await prisma.creatorLicenseAccount.create({
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

  const offer = await ensureCreatorRentalOffer({
    creatorId: user.id,
    toolId: payload.itemId,
    planId: payload.planId,
  });
  if (!offer) return NextResponse.json({ message: "El plan no existe." }, { status: 404 });
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
