import { prisma } from "@/lib/prisma";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const platforms = ["android", "ios", "windows", "macos", "web"] as const;
const downloadRateLimit = {
  limit: 8,
  windowMs: 60_000,
  blockMs: 15 * 60_000,
};

function isAllowedReferrer(request: NextRequest) {
  const referer = request.headers.get("referer");
  if (!referer) return true;

  try {
    return new URL(referer).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!isAllowedReferrer(request)) {
    return NextResponse.json({ message: "Origen no permitido." }, { status: 403 });
  }

  const rateLimit = checkRateLimit(
    getRateLimitKey(request, "movisur-download"),
    downloadRateLimit
  );

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: "Demasiadas descargas. Intenta nuevamente mas tarde." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfter),
          "X-RateLimit-Limit": String(downloadRateLimit.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  const platformParam =
    request.nextUrl.searchParams.get("platform")?.trim() || "android";
  const platform = platforms.includes(platformParam as (typeof platforms)[number])
    ? platformParam
    : "android";

  const version = await prisma.movisurVersion.findFirst({
    where: {
      platform: platform as (typeof platforms)[number],
      isActive: true,
      isSaleVersion: false,
    },
    orderBy: [{ buildNumber: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      downloadUrl: true,
    },
  });

  if (!version) {
    return NextResponse.redirect(new URL("/?download=empty", request.url));
  }

  await prisma.movisurVersion.update({
    where: { id: version.id },
    data: { downloads: { increment: 1 } },
  });

  const response = NextResponse.redirect(new URL(version.downloadUrl, request.url));
  response.headers.set("X-RateLimit-Limit", String(downloadRateLimit.limit));
  response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));

  return response;
}
