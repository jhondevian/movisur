import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type RatingPayload = {
  creatorId?: string;
  rating?: number;
};

async function getRatingSummary(creatorId: string) {
  const [aggregate, count] = await Promise.all([
    prisma.creatorVendorReview.aggregate({
      where: { creatorId },
      _avg: { rating: true },
    }),
    prisma.creatorVendorReview.count({
      where: { creatorId },
    }),
  ]);

  return {
    average: aggregate._avg.rating ?? 0,
    count,
  };
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Inicia sesion para calificar." },
      { status: 401 }
    );
  }

  let user;

  try {
    user = await verifyAuthToken(token);
  } catch {
    return NextResponse.json(
      { message: "Inicia sesion para calificar." },
      { status: 401 }
    );
  }

  const payload = (await request.json().catch(() => null)) as
    | RatingPayload
    | null;
  const creatorId = payload?.creatorId || "";
  const rating = Math.round(Number(payload?.rating || 0));

  if (!creatorId || rating < 1 || rating > 5) {
    return NextResponse.json(
      { message: "Calificacion invalida." },
      { status: 400 }
    );
  }

  const confirmedPurchase = await prisma.adminNotification.findFirst({
    where: {
      type: "binance_payment_confirmation",
      recipientUserId: creatorId,
      metadata: {
        contains: `"userId":"${user.id}"`,
      },
      AND: [
        {
          metadata: {
            contains: `"purchaseStatus":"confirmed"`,
          },
        },
      ],
    },
    select: { id: true },
  });

  if (!confirmedPurchase) {
    return NextResponse.json(
      { message: "Solo puedes calificar despues de una compra confirmada." },
      { status: 403 }
    );
  }

  await prisma.creatorVendorReview.upsert({
    where: {
      creatorId_reviewerId: {
        creatorId,
        reviewerId: user.id,
      },
    },
    update: { rating },
    create: {
      creatorId,
      reviewerId: user.id,
      rating,
    },
  });

  return NextResponse.json({
    ok: true,
    userRating: rating,
    summary: await getRatingSummary(creatorId),
  });
}
