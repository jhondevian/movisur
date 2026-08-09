import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { getPublicUrl } from "@/lib/request-url";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const revisionDownloadRateLimit = {
  limit: 12,
  windowMs: 60_000,
  blockMs: 15 * 60_000,
};

async function getAuthUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) return "";

  try {
    const user = await verifyAuthToken(token);
    return user.id;
  } catch {
    return "";
  }
}

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
  context: { params: Promise<{ id: string; revisionId: string }> }
) {
  const { id, revisionId } = await context.params;
  const revision = await prisma.movisurProductFileRevision.findFirst({
    where: {
      id: revisionId,
      productFileId: id,
      productFile: {
        isActive: true,
        deletedAt: null,
      },
    },
    include: {
      productFile: {
        select: {
          id: true,
          slug: true,
          isForSale: true,
        },
      },
    },
  });

  if (!revision) {
    return NextResponse.redirect(getPublicUrl(request, "/?archivo=no-disponible"));
  }

  const rateLimit = checkRateLimit(
    getRateLimitKey(request, "movisur-revision-download"),
    revisionDownloadRateLimit
  );

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: "Demasiadas descargas. Intenta nuevamente mas tarde." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
    );
  }

  const latestPrevious = await prisma.movisurProductFileRevision.findFirst({
    where: {
      productFileId: id,
      isCurrent: false,
    },
    orderBy: { versionNumber: "desc" },
    select: { id: true },
  });
  const userId = await getAuthUserId();
  const requiresPlan =
    revision.productFile.isForSale ||
    (!revision.isCurrent && latestPrevious?.id !== revision.id);

  if (!userId) {
    const nextPath = requiresPlan
      ? "/informacion?comprar=1"
      : `/productos/${revision.productFile.slug}`;

    return NextResponse.redirect(
      getPublicUrl(request, `/signin?next=${encodeURIComponent(nextPath)}`)
    );
  }

  if (requiresPlan) {
    const canDownload = await hasConfirmedPurchase(userId);

    if (!canDownload) {
      return NextResponse.redirect(getPublicUrl(request, "/informacion?comprar=1"));
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.movisurProductFile.update({
      where: { id: revision.productFile.id },
      data: { downloads: { increment: 1 } },
    });

    if (userId) {
      await tx.movisurProductFileDownload.upsert({
        where: {
          productFileId_userId: {
            productFileId: revision.productFile.id,
            userId,
          },
        },
        update: {
          downloadCount: { increment: 1 },
          lastDownloadedAt: new Date(),
        },
        create: {
          productFileId: revision.productFile.id,
          userId,
        },
      });
    }
  });

  return NextResponse.redirect(getPublicUrl(request, revision.downloadUrl));
}
