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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireAdminUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const currentRelease = await prisma.movisurAppRelease.findUnique({
    where: { id },
  });

  if (!currentRelease) {
    return NextResponse.json({ message: "El APK no existe." }, { status: 404 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json(
      { message: "El APK es demasiado grande para el limite actual del servidor." },
      { status: 413 }
    );
  }

  const version = getString(formData, "version");
  const buildNumber = Number(getString(formData, "buildNumber"));
  const releaseType = getString(formData, "releaseType") || "stable";
  const changelog = getString(formData, "changelog");
  const downloadUrl = getString(formData, "downloadUrl");
  const file = formData.get("file");

  if (!version) {
    return NextResponse.json(
      { message: "La version es obligatoria." },
      { status: 400 }
    );
  }

  if (!Number.isInteger(buildNumber) || buildNumber < 1) {
    return NextResponse.json(
      { message: "El build debe ser un numero entero mayor a 0." },
      { status: 400 }
    );
  }

  if (!isValidValue(releaseTypes, releaseType)) {
    return NextResponse.json(
      { message: "Selecciona un tipo de release valido." },
      { status: 400 }
    );
  }

  const existingBuild = await prisma.movisurAppRelease.findFirst({
    where: {
      buildNumber,
      platform: "android",
      id: { not: id },
    },
    select: { id: true },
  });

  if (existingBuild) {
    return NextResponse.json(
      { message: "Ya existe un APK con ese build." },
      { status: 409 }
    );
  }

  let finalDownloadUrl = currentRelease.downloadUrl;
  let fileName = currentRelease.fileName;
  let fileSize = currentRelease.fileSize;
  let distribution = currentRelease.distribution;

  if (file instanceof File && file.size > 0) {
    if (!file.name.toLowerCase().endsWith(".apk")) {
      return NextResponse.json(
        { message: "Solo se permite subir archivos .apk." },
        { status: 400 }
      );
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
  } else if (downloadUrl) {
    finalDownloadUrl = downloadUrl;
    fileName = null;
    fileSize = null;
    distribution = "url";
  }

  try {
    const updated = await prisma.movisurAppRelease.update({
      where: { id },
      data: {
        version,
        buildNumber,
        releaseType,
        distribution,
        downloadUrl: finalDownloadUrl,
        fileName,
        fileSize,
        changelog: changelog || null,
        forceUpdate: getBoolean(formData, "forceUpdate"),
        isActive: getBoolean(formData, "isActive"),
        showForUsers: getBoolean(formData, "showForUsers"),
        showForCreators: getBoolean(formData, "showForCreators"),
      },
    });

    return NextResponse.json({ release: jsonSafe(updated) });
  } catch (error) {
    console.error("Update Movisur app release error", error);
    return NextResponse.json(
      { message: "No se pudo actualizar el APK. Revisa si el build ya existe." },
      { status: 500 }
    );
  }
}
