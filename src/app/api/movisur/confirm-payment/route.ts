import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { sendPushToUsers } from "@/lib/mobile-push";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

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
  proofImageUrl?: string;
};

type PaymentMetadata = ConfirmPaymentPayload & {
  userId?: string;
  purchaseStatus?: string;
};

const allowedProofTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

function parseNotificationMetadata(metadata: string | null): PaymentMetadata {
  if (!metadata) return {};

  try {
    return JSON.parse(metadata) as PaymentMetadata;
  } catch {
    return {};
  }
}

function isSamePendingConfirmation(
  current: Record<string, unknown>,
  stored: PaymentMetadata,
) {
  if (stored.purchaseStatus === "rejected") return false;
  if (stored.userId !== current.userId) return false;
  if (stored.commerceType !== current.commerceType) return false;

  const currentOfferId =
    typeof current.offerId === "string" ? current.offerId : "";
  const currentPlanId =
    typeof current.planId === "string" ? current.planId : "";

  if (currentOfferId) return stored.offerId === currentOfferId;
  if (currentPlanId) return stored.planId === currentPlanId;

  return false;
}

async function savePaymentProof(file: File) {
  if (file.size <= 0) {
    throw new Error("Selecciona una imagen valida del comprobante.");
  }

  if (!allowedProofTypes.has(file.type)) {
    throw new Error("El comprobante debe ser PNG, JPG o WebP.");
  }

  if (file.size > 8 * 1024 * 1024) {
    throw new Error("El comprobante no debe superar 8 MB.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExtension = ["png", "jpg", "jpeg", "webp"].includes(extension)
    ? extension
    : "jpg";
  const fileName = `proof-${Date.now()}-${crypto.randomUUID()}.${safeExtension}`;
  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "movisur",
    "payment-proofs",
  );

  await mkdir(uploadDir, { recursive: true });
  await writeFile(
    path.join(uploadDir, fileName),
    Buffer.from(await file.arrayBuffer()),
  );

  return `/uploads/movisur/payment-proofs/${fileName}`;
}

async function parseConfirmPaymentPayload(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const proof = formData.get("proof");

    if (!(proof instanceof File)) {
      throw new Error("Sube una captura o imagen del comprobante.");
    }

    return {
      payload: {
        planId: String(formData.get("planId") || ""),
        planName: String(formData.get("planName") || ""),
        commerceType: String(formData.get("commerceType") || "") as
          "license" | "rental" | undefined,
        offerId: String(formData.get("offerId") || ""),
        price: String(formData.get("price") || ""),
        currency: String(formData.get("currency") || ""),
        method: String(formData.get("method") || ""),
      },
      proofImageUrl: await savePaymentProof(proof),
    };
  }

  const payload = (await request
    .json()
    .catch(() => null)) as ConfirmPaymentPayload | null;

  return { payload, proofImageUrl: payload?.proofImageUrl || "" };
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Inicia sesion para confirmar el pago." },
      { status: 401 },
    );
  }

  let authUser;

  try {
    authUser = await verifyAuthToken(token);
  } catch {
    return NextResponse.json(
      { message: "Inicia sesion para confirmar el pago." },
      { status: 401 },
    );
  }

  const rateLimit = checkRateLimit(
    getRateLimitKey(request, "movisur-confirm-payment"),
    confirmPaymentRateLimit,
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
      },
    );
  }

  let parsedPayload;

  try {
    parsedPayload = await parseConfirmPaymentPayload(request);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Sube una captura o imagen del comprobante.",
      },
      { status: 400 },
    );
  }

  const { payload, proofImageUrl } = parsedPayload;

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
      { status: 400 },
    );
  }

  if (!proofImageUrl) {
    return NextResponse.json(
      { message: "Sube una captura o imagen del comprobante." },
      { status: 400 },
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
    userAvatarUrl: authUser.avatarUrl,
    currency,
    proofImageUrl,
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
        { status: 404 },
      );
    }

    if (offer.creatorId === authUser.id) {
      return NextResponse.json(
        { message: "No puedes comprar tu propia licencia." },
        { status: 403 },
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
        { status: 404 },
      );
    }

    if (offer.creatorId === authUser.id) {
      return NextResponse.json(
        { message: "No puedes comprar tu propio alquiler." },
        { status: 403 },
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
        { status: 404 },
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

  const duplicateWindow = new Date(Date.now() - 10 * 60_000);

  const duplicateCandidates = await prisma.adminNotification.findMany({
    where: {
      type: "binance_payment_confirmation",
      recipientUserId,
      metadata: {
        contains: `"userId":"${authUser.id}"`,
      },
      createdAt: {
        gte: duplicateWindow,
      },
    },
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      metadata: true,
      isRead: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  const duplicate = duplicateCandidates.find((notification) =>
    isSamePendingConfirmation(
      metadata,
      parseNotificationMetadata(notification.metadata),
    ),
  );

  if (duplicate) {
    return NextResponse.json({
      notification: duplicate,
      duplicate: true,
      message:
        "Ya tienes una confirmacion enviada para esta compra. Revisa tus confirmaciones enviadas.",
    });
  }

  const metadataText = JSON.stringify(metadata);

  const notification = await prisma.adminNotification.create({
    data: {
      type: "binance_payment_confirmation",
      recipientUserId,
      title,
      message,
      metadata: metadataText,
    },
  });

  const pushPayload = {
    title,
    body: message || "Nueva confirmacion de pago pendiente.",
    notificationId: notification.id,
    route: "vaults",
    type: "binance_payment_confirmation",
  };

  if (recipientUserId) {
    await sendPushToUsers([recipientUserId], pushPayload);
  }

  return NextResponse.json(
    { notification },
    {
      status: 201,
      headers: {
        "X-RateLimit-Limit": String(confirmPaymentRateLimit.limit),
        "X-RateLimit-Remaining": String(rateLimit.remaining),
      },
    },
  );
}
