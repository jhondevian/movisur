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
    const refererUrl = new URL(referer);
    const normalizeHost = (host: string) => host.replace(/^www\./, "");

    return normalizeHost(refererUrl.hostname) === normalizeHost(request.nextUrl.hostname);
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!isAllowedReferrer(request)) {
    return NextResponse.redirect(new URL("/?download=forbidden", request.url));
  }

  const rateLimit = checkRateLimit(
    getRateLimitKey(request, "movisur-download"),
    downloadRateLimit
  );

  if (!rateLimit.allowed) {
    const blockedUrl = new URL("/", request.url);
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
