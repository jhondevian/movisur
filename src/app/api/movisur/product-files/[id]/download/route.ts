import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const productDownloadRateLimit = {
  limit: 12,
  windowMs: 60_000,
  blockMs: 15 * 60_000,
};

async function hasConfirmedPurchase(userId: string) {
  const purchase = await prisma.adminNotification.findFirst({
    where: {
      type: "binance_payment_confirmation",
      metadata: {
        contains: `"userId":"${userId}"`,
      },
      AND: [
        {
          metadata: {
            contains: `"purchaseStatus":"confirmed"`,
          },
        },
      ],
    },
    select: {
      id: true,
    },
  });

  return Boolean(purchase);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const file = await prisma.movisurProductFile.findFirst({
    where: {
      id,
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      slug: true,
      downloadUrl: true,
      isForSale: true,
    },
  });

  if (!file) {
    return NextResponse.redirect(new URL("/?archivo=no-disponible", request.url));
  }

  const rateLimit = checkRateLimit(
    getRateLimitKey(request, "movisur-product-download"),
    productDownloadRateLimit
  );

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: "Demasiadas descargas. Intenta nuevamente mas tarde." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfter),
        },
      }
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;
  let userId = "";

  if (!token) {
    const nextPath = file.isForSale
      ? "/informacion?comprar=1"
      : `/productos/${file.slug}`;

    return NextResponse.redirect(
      new URL(`/signin?next=${encodeURIComponent(nextPath)}`, request.url)
    );
  }

  try {
    const user = await verifyAuthToken(token);
    userId = user.id;
  } catch {
    const nextPath = file.isForSale
      ? "/informacion?comprar=1"
      : `/productos/${file.slug}`;

    return NextResponse.redirect(
      new URL(`/signin?next=${encodeURIComponent(nextPath)}`, request.url)
    );
  }

  if (file.isForSale) {
    const canDownload = await hasConfirmedPurchase(userId);

    if (!canDownload) {
      return NextResponse.redirect(new URL("/informacion?comprar=1", request.url));
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.movisurProductFile.update({
      where: { id: file.id },
      data: { downloads: { increment: 1 } },
    });

    if (userId) {
      await tx.movisurProductFileDownload.upsert({
        where: {
          productFileId_userId: {
            productFileId: file.id,
            userId,
          },
        },
        update: {
          downloadCount: { increment: 1 },
          lastDownloadedAt: new Date(),
        },
        create: {
          productFileId: file.id,
          userId,
        },
      });
    }
  });

  return NextResponse.redirect(new URL(file.downloadUrl, request.url));
}
