import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const role = request.nextUrl.searchParams.get("role") || "usuario";

  const release = await prisma.movisurAppRelease.findFirst({
    where: {
      id,
      isActive: true,
      ...(role === "creador" ? { showForCreators: true } : { showForUsers: true }),
    },
  });

  if (!release) {
    return NextResponse.json(
      { message: "APK no disponible." },
      { status: 404 }
    );
  }

  await prisma.movisurAppRelease.update({
    where: { id },
    data: { downloads: { increment: 1 } },
  });

  return NextResponse.redirect(new URL(release.downloadUrl, request.url));
}
