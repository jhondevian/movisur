import { prisma } from "@/lib/prisma";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { getPublicUrl, isAllowedSiteReferrer } from "@/lib/request-url";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const platforms = ["android", "ios", "windows", "macos", "web"] as const;
const downloadRateLimit = {
  limit: 8,
  windowMs: 60_000,
  blockMs: 15 * 60_000,
};

export async function GET(request: NextRequest) {
  if (!isAllowedSiteReferrer(request)) {
    return NextResponse.redirect(getPublicUrl(request, "/?download=forbidden"));
  }

  const rateLimit = checkRateLimit(
    getRateLimitKey(request, "movisur-download"),
    downloadRateLimit
  );

  if (!rateLimit.allowed) {
    const blockedUrl = getPublicUrl(request, "/");
    blockedUrl.searchParams.set("download", "blocked");
    blockedUrl.searchParams.set("retry", String(rateLimit.retryAfter));
    const response = NextResponse.redirect(blockedUrl);
    response.headers.set("Retry-After", String(rateLimit.retryAfter));
    response.headers.set("X-RateLimit-Limit", String(downloadRateLimit.limit));
    response.headers.set("X-RateLimit-Remaining", "0");

    return response;
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
    return NextResponse.redirect(getPublicUrl(request, "/?download=empty"));
  }

  await prisma.movisurVersion.update({
    where: { id: version.id },
    data: { downloads: { increment: 1 } },
  });

  const response = NextResponse.redirect(getPublicUrl(request, version.downloadUrl));
  response.headers.set("X-RateLimit-Limit", String(downloadRateLimit.limit));
  response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));

  return response;
}
