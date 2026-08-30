import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site-metadata";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || "";
}

function safeOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

function getPublicOrigin(request: NextRequest) {
  const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host"));
  const host = forwardedHost || firstHeaderValue(request.headers.get("host"));

  if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
    const protocol =
      firstHeaderValue(request.headers.get("x-forwarded-proto")) ||
      (host.startsWith("localhost") ? "http" : "https");

    const origin = safeOrigin(`${protocol}://${host}`);

    if (origin) return origin;
  }

  return siteUrl;
}

function getDownloadRedirectUrl(request: NextRequest, downloadUrl: string) {
  try {
    return new URL(downloadUrl).toString();
  } catch {
    return new URL(
      downloadUrl.startsWith("/") ? downloadUrl : `/${downloadUrl}`,
      getPublicOrigin(request)
    ).toString();
  }
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
