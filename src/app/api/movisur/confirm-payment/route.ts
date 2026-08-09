import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const confirmPaymentRateLimit = {
  limit: 3,
  windowMs: 10 * 60_000,
  blockMs: 30 * 60_000,
};

type ConfirmPaymentPayload = {
  planId?: string;
  planName?: string;
  commerceType?: "license" | "rental";
  offerId?: string;
  price?: string;
  currency?: string;
  method?: string;
};

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Inicia sesion para confirmar el pago." },
      { status: 401 }
    );
  }

  let authUser;

  try {
    authUser = await verifyAuthToken(token);
  } catch {
    return NextResponse.json(
      { message: "Inicia sesion para confirmar el pago." },
      { status: 401 }
    );
  }

  const rateLimit = checkRateLimit(
    getRateLimitKey(request, "movisur-confirm-payment"),
    confirmPaymentRateLimit
  );

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: "Demasiadas confirmaciones. Intenta mas tarde." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfter),
          "X-RateLimit-Limit": String(confirmPaymentRateLimit.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  const payload = (await request.json().catch(() => null)) as
    | ConfirmPaymentPayload
    | null;

  const paymentMethod =
    payload?.method === "transferencia" || payload?.method === "yape"
      ? "yape"
      : payload?.method;

  if (
    (!payload?.planId && !payload?.offerId) ||
    (paymentMethod !== "binance" && paymentMethod !== "yape")
  ) {
    return NextResponse.json(
      { message: "Confirmacion de pago invalida." },
      { status: 400 }
    );
  }

  const currency = payload.currency || "USD";
  let title = `Pago ${paymentMethod === "yape" ? "Yape" : "Binance"} por confirmar`;
  let message = "";
  let recipientUserId: string | null = null;
  let metadata: Record<string, unknown> = {
    method: paymentMethod,
    userId: authUser.id,
    userEmail: authUser.email,
    userName: `${authUser.firstName} ${authUser.lastName}`.trim(),
    currency,
  };

  if (payload.commerceType === "license" && payload.offerId) {
    const offer = await prisma.creatorLicenseOffer.findFirst({
      where: {
        id: payload.offerId,
        isActive: true,
      },
      include: {
        product: true,
        plan: true,
      },
    });

    if (!offer) {
      return NextResponse.json(
        { message: "La licencia seleccionada no existe." },
        { status: 404 }
      );
    }

    if (offer.creatorId === authUser.id) {
      return NextResponse.json(
        { message: "No puedes comprar tu propia licencia." },
        { status: 403 }
      );
    }

    title = `Pago ${paymentMethod === "yape" ? "Yape" : "Binance"} de licencia por confirmar`;
    recipientUserId = offer.creatorId;
    message = `${offer.product.name} - ${offer.plan.name} - ${
      offer.currency
    } ${offer.price.toString()}`;
    metadata = {
      ...metadata,
      commerceType: "license",
      offerId: offer.id,
      creatorId: offer.creatorId,
      itemName: offer.product.name,
      planId: offer.planId,
      planName: offer.plan.name,
      durationMonths: offer.plan.durationMonths,
      price: offer.price.toString(),
      currency: offer.currency,
    };
  } else if (payload.commerceType === "rental" && payload.offerId) {
    const offer = await prisma.creatorRentalOffer.findFirst({
      where: {
        id: payload.offerId,
        isActive: true,
      },
      include: {
        tool: true,
        plan: true,
      },
    });

    if (!offer) {
      return NextResponse.json(
        { message: "El alquiler seleccionado no existe." },
        { status: 404 }
      );
    }

    if (offer.creatorId === authUser.id) {
      return NextResponse.json(
        { message: "No puedes comprar tu propio alquiler." },
        { status: 403 }
      );
    }

    title = `Pago ${paymentMethod === "yape" ? "Yape" : "Binance"} de alquiler por confirmar`;
    recipientUserId = offer.creatorId;
    message = `${offer.tool.name} - ${offer.plan.name} - ${
      offer.currency
    } ${offer.price.toString()}`;
    metadata = {
      ...metadata,
      commerceType: "rental",
      offerId: offer.id,
      creatorId: offer.creatorId,
      itemName: offer.tool.name,
      planId: offer.planId,
      planName: offer.plan.name,
      durationMonths: offer.plan.durationMonths,
      price: offer.price.toString(),
      currency: offer.currency,
    };
  } else {
    const plan = await prisma.movisurSalePlan.findUnique({
      where: { id: payload.planId },
      select: {
        id: true,
        name: true,
        price: true,
        durationMonths: true,
      },
    });

    if (!plan) {
      return NextResponse.json(
        { message: "El plan seleccionado no existe." },
        { status: 404 }
      );
    }

    message = `${payload.planName || plan.name} - ${currency} ${
      payload.price || plan.price.toString()
    }`;
    metadata = {
      ...metadata,
      planId: plan.id,
      planName: plan.name,
      durationMonths: plan.durationMonths,
      price: plan.price.toString(),
    };
  }

  const metadataText = JSON.stringify(metadata);
  const duplicateWindow = new Date(Date.now() - 10 * 60_000);

  const duplicate = await prisma.adminNotification.findFirst({
    where: {
      type: "binance_payment_confirmation",
      metadata: metadataText,
      createdAt: {
        gte: duplicateWindow,
      },
    },
    select: {
      id: true,
    },
  });

  if (duplicate) {
    return NextResponse.json(
      { message: "Ya se envio una confirmacion reciente para este plan." },
      { status: 409 }
    );
  }

  const notification = await prisma.adminNotification.create({
    data: {
      type: "binance_payment_confirmation",
      recipientUserId,
      title,
      message,
      metadata: metadataText,
    },
  });

  return NextResponse.json(
    { notification },
    {
      status: 201,
      headers: {
        "X-RateLimit-Limit": String(confirmPaymentRateLimit.limit),
        "X-RateLimit-Remaining": String(rateLimit.remaining),
      },
    }
  );
}
