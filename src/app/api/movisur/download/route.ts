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

function redirectTo(location: string) {
  return new NextResponse(null, {
    status: 302,
    headers: {
      Location: location,
    },
  });
}

export async function GET(request: NextRequest) {
  const rateLimit = checkRateLimit(
    getRateLimitKey(request, "movisur-download"),
    downloadRateLimit
  );

  if (!rateLimit.allowed) {
    const blockedUrl = new URLSearchParams();
    blockedUrl.set("download", "blocked");
    blockedUrl.set("retry", String(rateLimit.retryAfter));
    const response = redirectTo(`/?${blockedUrl.toString()}`);
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
    return redirectTo("/?download=empty");
  }

  await prisma.movisurVersion.update({
    where: { id: version.id },
    data: { downloads: { increment: 1 } },
  });

  const response = redirectTo(version.downloadUrl);
  response.headers.set("X-RateLimit-Limit", String(downloadRateLimit.limit));
  response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));

  return response;
}
