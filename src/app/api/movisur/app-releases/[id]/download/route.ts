import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site-metadata";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { Readable } from "stream";

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

function getLocalApkPath(downloadUrl: string) {
  if (!downloadUrl.startsWith("/uploads/movisur-app/")) return null;

  const fileName = path.basename(downloadUrl);
  if (!fileName.toLowerCase().endsWith(".apk")) return null;

  return path.join(process.cwd(), "public", "uploads", "movisur-app", fileName);
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

  const localApkPath = getLocalApkPath(release.downloadUrl);

  if (localApkPath) {
    try {
      const fileStats = await stat(localApkPath);
      const stream = Readable.toWeb(createReadStream(localApkPath));

      return new NextResponse(stream as BodyInit, {
        headers: {
          "Content-Disposition": 'attachment; filename="Movisur.apk"',
          "Content-Length": fileStats.size.toString(),
          "Content-Type": "application/vnd.android.package-archive",
        },
      });
    } catch {
      return NextResponse.json(
        { message: "El archivo APK no esta disponible en el servidor." },
        { status: 404 }
      );
    }
  }

  return NextResponse.redirect(
    getDownloadRedirectUrl(request, release.downloadUrl)
  );
}
