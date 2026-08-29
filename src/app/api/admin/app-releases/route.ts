import { requireAdminUser } from "@/lib/admin-auth";
import { jsonSafe } from "@/lib/json";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export const runtime = "nodejs";

const releaseTypes = ["stable", "beta", "alpha"] as const;

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function isValidValue<T extends readonly string[]>(
  values: T,
  value: string
): value is T[number] {
  return values.includes(value);
}

async function buildReleasePayload(formData: FormData) {
  const version = getString(formData, "version");
  const buildNumber = Number(getString(formData, "buildNumber"));
  const releaseType = getString(formData, "releaseType") || "stable";
  const changelog = getString(formData, "changelog");
  const downloadUrl = getString(formData, "downloadUrl");
  const uploadKey = getString(formData, "uploadKey");
  const file = formData.get("file");

  if (!version) throw new Error("La version es obligatoria.");
  if (!Number.isInteger(buildNumber) || buildNumber < 1) {
    throw new Error("El build debe ser un numero entero mayor a 0.");
  }
  if (!isValidValue(releaseTypes, releaseType)) {
    throw new Error("Selecciona un tipo de release valido.");
  }

  let finalDownloadUrl = downloadUrl;
  let fileName: string | null = null;
  let fileSize: bigint | null = null;
  let distribution: "url" | "file" = "url";

  if (file instanceof File && file.size > 0) {
    if (!file.name.toLowerCase().endsWith(".apk")) {
      throw new Error("Solo se permite subir archivos .apk.");
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const storedName = `${Date.now()}-${safeName}`;
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "movisur-app"
    );

    await mkdir(uploadDir, { recursive: true });
    await writeFile(
      path.join(uploadDir, storedName),
      Buffer.from(await file.arrayBuffer())
    );

    finalDownloadUrl = `/uploads/movisur-app/${storedName}`;
    fileName = file.name;
    fileSize = BigInt(file.size);
    distribution = "file";
  }

  if (!finalDownloadUrl) {
    throw new Error("Agrega una URL de descarga o sube un APK.");
  }

  return {
    version,
    buildNumber,
    platform: "android" as const,
    releaseType,
    distribution,
    downloadUrl: finalDownloadUrl,
    uploadKey,
    fileName,
    fileSize,
    changelog,
    forceUpdate: getBoolean(formData, "forceUpdate"),
    isActive: getBoolean(formData, "isActive"),
    showForUsers: getBoolean(formData, "showForUsers"),
    showForCreators: getBoolean(formData, "showForCreators"),
  };
}

export async function GET() {
  const user = await requireAdminUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const releases = await prisma.movisurAppRelease.findMany({
    orderBy: [{ buildNumber: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ releases: jsonSafe(releases) });
}

export async function POST(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json(
      { message: "El APK es demasiado grande para el limite actual del servidor." },
      { status: 413 }
    );
  }

  try {
    const payload = await buildReleasePayload(formData);

    const existingBuild = await prisma.movisurAppRelease.findFirst({
      where: {
        buildNumber: payload.buildNumber,
        platform: payload.platform,
      },
      select: { id: true },
    });

    if (existingBuild) {
      return NextResponse.json(
        { message: "Ya existe un APK con ese build." },
        { status: 409 }
      );
    }

    if (payload.uploadKey) {
      const existingUpload = await prisma.movisurAppRelease.findUnique({
        where: { uploadKey: payload.uploadKey },
      });

      if (existingUpload) {
        return NextResponse.json({
          release: jsonSafe(existingUpload),
          reused: true,
        });
      }
    }

    const created = await prisma.movisurAppRelease.create({
      data: {
        ...payload,
        uploadKey: payload.uploadKey || null,
        changelog: payload.changelog || null,
        createdById: user.id,
      },
    });

    return NextResponse.json({ release: jsonSafe(created) }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo crear el APK.";

    return NextResponse.json({ message }, { status: 400 });
  }
}
