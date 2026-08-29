import { jsonSafe } from "@/lib/json";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const roles = ["usuario", "creador"] as const;

export async function GET(request: NextRequest) {
  const roleParam = request.nextUrl.searchParams.get("role")?.trim() || "usuario";
  const role = roles.includes(roleParam as (typeof roles)[number])
    ? roleParam
    : "usuario";

  const release = await prisma.movisurAppRelease.findFirst({
    where: {
      platform: "android",
      isActive: true,
      ...(role === "creador" ? { showForCreators: true } : { showForUsers: true }),
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
      showForUsers: true,
      showForCreators: true,
      createdAt: true,
    },
  });

  if (!release) {
    return NextResponse.json(
      { message: "No hay APK disponible para este rol." },
      { status: 404 }
    );
  }

  return NextResponse.json({ release: jsonSafe(release) });
}
