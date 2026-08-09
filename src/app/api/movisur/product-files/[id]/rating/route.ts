import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ratingRateLimit = {
  limit: 10,
  windowMs: 60_000,
  blockMs: 10 * 60_000,
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

  const rateLimit = checkRateLimit(
    getRateLimitKey(request, "movisur-product-rating"),
    ratingRateLimit
  );

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: "Demasiadas calificaciones. Intenta mas tarde." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
    );
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    rating?: number;
  } | null;
  const rating = Number(body?.rating);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { message: "Selecciona una calificacion valida." },
      { status: 400 }
    );
  }

  const productFile = await prisma.movisurProductFile.findFirst({
    where: { id, isActive: true, deletedAt: null },
    select: {
      id: true,
      createdById: true,
    },
  });

  if (!productFile) {
    return NextResponse.json(
      { message: "El producto no existe." },
      { status: 404 }
    );
  }

  const download = await prisma.movisurProductFileDownload.findUnique({
    where: {
      productFileId_userId: {
        productFileId: productFile.id,
        userId: user.id,
      },
    },
    select: {
      id: true,
    },
  });

  if (!download) {
    return NextResponse.json(
      { message: "Descarga el producto antes de calificar." },
      { status: 403 }
    );
  }

  await prisma.movisurProductFileReview.upsert({
    where: {
      productFileId_userId: {
        productFileId: productFile.id,
        userId: user.id,
      },
    },
    update: {
      rating,
      uploaderId: productFile.createdById,
    },
    create: {
      productFileId: productFile.id,
      userId: user.id,
      uploaderId: productFile.createdById,
      rating,
    },
  });

  const [aggregate, count] = await Promise.all([
    prisma.movisurProductFileReview.aggregate({
      where: { productFileId: productFile.id },
      _avg: { rating: true },
    }),
    prisma.movisurProductFileReview.count({
      where: { productFileId: productFile.id },
    }),
  ]);

  return NextResponse.json({
    rating,
    averageRating: aggregate._avg.rating ?? 0,
    ratingCount: count,
  });
}
