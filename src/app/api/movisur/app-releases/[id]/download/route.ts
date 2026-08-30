import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site-metadata";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function getPublicOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");

  if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
    const protocol =
      request.headers.get("x-forwarded-proto") ||
      (host.startsWith("localhost") ? "http" : "https");

    return `${protocol}://${host}`;
  }

  return siteUrl;
}

function getDownloadRedirectUrl(request: NextRequest, downloadUrl: string) {
  if (downloadUrl.startsWith("http://") || downloadUrl.startsWith("https://")) {
    return downloadUrl;
  }

  return new URL(downloadUrl, getPublicOrigin(request)).toString();
}

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

  return NextResponse.redirect(
    getDownloadRedirectUrl(request, release.downloadUrl)
  );
}
