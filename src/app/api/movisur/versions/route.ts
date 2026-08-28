import { jsonSafe } from "@/lib/json";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const platforms = ["android", "ios", "windows", "macos", "web"] as const;

export async function GET(request: NextRequest) {
  const platformParam =
    request.nextUrl.searchParams.get("platform")?.trim() || "android";
  const platform = platforms.includes(platformParam as (typeof platforms)[number])
    ? platformParam
    : "android";

  const version = await prisma.movisurVersion.findFirst({
    where: {
      platform: platform as (typeof platforms)[number],
      isActive: true,
    },
    orderBy: [{ buildNumber: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      version: true,
      buildNumber: true,
      platform: true,
      releaseType: true,
      downloadUrl: true,
      fileName: true,
      fileSize: true,
      changelog: true,
      downloads: true,
      forceUpdate: true,
      createdAt: true,
    },
  });

  if (!version) {
    return NextResponse.json(
      { message: "No hay versiones disponibles." },
      { status: 404 }
    );
  }

  return NextResponse.json({ version: jsonSafe(version) });
}
