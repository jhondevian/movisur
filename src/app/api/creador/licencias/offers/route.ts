import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type OfferPayload = {
  itemId?: string;
  planId?: string;
  price?: number;
  currency?: string;
  isActive?: boolean;
};

function cleanPrice(value: unknown) {
  const price = Number(value);
  return Number.isFinite(price) ? Math.max(0, price) : 0;
}

function cleanCurrency(value: unknown) {
  const currency = typeof value === "string" ? value.toUpperCase() : "USD";
  return ["USD", "PEN", "BOB"].includes(currency) ? currency : "USD";
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  let user;

  try {
    user = await verifyAuthToken(token);
  } catch {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  if (user.role !== "creador" && user.role !== "admin") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    offers?: OfferPayload[];
  } | null;

  const offers = Array.isArray(body?.offers)
    ? body.offers.filter((offer) => offer.itemId && offer.planId)
    : [];

  if (offers.length === 0) {
    return NextResponse.json({ ok: true });
  }

  await prisma.$transaction(
    offers.map((offer) =>
        prisma.creatorLicenseOffer.upsert({
          where: {
            creatorId_planId: {
              creatorId: user.id,
              planId: offer.planId || "",
            },
          },
          update: {
            price: cleanPrice(offer.price),
            currency: cleanCurrency(offer.currency),
            isActive: Boolean(offer.isActive),
          },
          create: {
            creatorId: user.id,
            productId: offer.itemId || "",
            planId: offer.planId || "",
            price: cleanPrice(offer.price),
            currency: cleanCurrency(offer.currency),
            isActive: Boolean(offer.isActive),
          },
        })
      )
  );

  return NextResponse.json({ ok: true });
}
