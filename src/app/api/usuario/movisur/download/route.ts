import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const buyerDownloadRateLimit = {
  limit: 12,
  windowMs: 60_000,
  blockMs: 15 * 60_000,
};

function redirectTo(location: string) {
  return new NextResponse(null, {
    status: 302,
    headers: {
      Location: location,
    },
  });
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) {
    return redirectTo("/signin?next=/usuario/descargas");
  }

  let user;

  try {
    user = await verifyAuthToken(token);
  } catch {
    return redirectTo("/signin?next=/usuario/descargas");
  }

  const rateLimit = checkRateLimit(
    getRateLimitKey(request, "usuario-movisur-download"),
    buyerDownloadRateLimit
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

  const [freeVersion, saleVersion, confirmedPurchase] = await Promise.all([
    prisma.movisurVersion.findFirst({
      where: {
        isActive: true,
        isSaleVersion: false,
      },
      orderBy: [{ buildNumber: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        downloadUrl: true,
        isSaleVersion: true,
      },
    }),
    prisma.movisurVersion.findFirst({
      where: {
        isActive: true,
        isSaleVersion: true,
      },
      orderBy: [{ buildNumber: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        downloadUrl: true,
        isSaleVersion: true,
      },
    }),
    prisma.adminNotification.findFirst({
      where: {
        type: "binance_payment_confirmation",
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
      select: {
        id: true,
      },
    }),
  ]);

  const version = freeVersion || saleVersion;

  if (!version) {
    return redirectTo("/usuario/descargas?download=empty");
  }

  if (version.isSaleVersion && !confirmedPurchase) {
    return redirectTo("/usuario/compras");
  }

  await prisma.movisurVersion.update({
    where: { id: version.id },
    data: { downloads: { increment: 1 } },
  });

  return redirectTo(version.downloadUrl);
}
