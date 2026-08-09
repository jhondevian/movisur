import { requireAdminUser } from "@/lib/admin-auth";
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

export async function GET() {
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const versions = await prisma.movisurVersion.findMany({
    orderBy: [{ createdAt: "desc" }],
  });

  return NextResponse.json({ versions });
}

export async function POST(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const version = getString(formData, "version");
  const platform = "android";
  const releaseType = getString(formData, "releaseType") || "stable";
  const changelog = getString(formData, "changelog");
  const downloadUrl = getString(formData, "downloadUrl");
  const uploadKey = getString(formData, "uploadKey");
  const file = formData.get("file");
  const isActive = getBoolean(formData, "isActive");
  const isSaleVersion = getBoolean(formData, "isSaleVersion");

  if (!version) {
    return NextResponse.json(
      { message: "La version es obligatoria." },
      { status: 400 }
    );
  }

  if (!uploadKey) {
    return NextResponse.json(
      { message: "No se pudo identificar la subida. Intenta otra vez." },
      { status: 400 }
    );
  }

  const existingUpload = await prisma.movisurVersion.findUnique({
    where: { uploadKey },
  });

  if (existingUpload) {
    return NextResponse.json({ version: existingUpload, reused: true });
  }

  if (!isValidValue(releaseTypes, releaseType)) {
    return NextResponse.json(
      { message: "Selecciona un tipo de release valido." },
      { status: 400 }
    );
  }

  let finalDownloadUrl = downloadUrl;
  let fileName: string | null = null;
  let fileSize: number | null = null;
  let distribution: "url" | "file" = "url";

  if (file instanceof File && file.size > 0) {
    if (!file.name.toLowerCase().endsWith(".zip")) {
      return NextResponse.json(
        { message: "Solo se permite subir archivos .zip." },
        { status: 400 }
      );
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const storedName = `${Date.now()}-${safeName}`;
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "movisur"
    );

    await mkdir(uploadDir, { recursive: true });
    await writeFile(
      path.join(uploadDir, storedName),
      Buffer.from(await file.arrayBuffer())
    );

    finalDownloadUrl = `/uploads/movisur/${storedName}`;
    fileName = file.name;
    fileSize = file.size;
    distribution = "file";
  }

  if (!finalDownloadUrl) {
    return NextResponse.json(
      { message: "Agrega una URL de descarga o sube un archivo ZIP." },
      { status: 400 }
    );
  }

  try {
    const latestVersion = await prisma.movisurVersion.findFirst({
      where: { platform },
      orderBy: { buildNumber: "desc" },
      select: { buildNumber: true },
    });

    const buildNumber = (latestVersion?.buildNumber ?? 0) + 1;

    const created = await prisma.$transaction(async (tx) => {
      if (isSaleVersion) {
        await tx.movisurVersion.updateMany({
          where: { isSaleVersion: true },
          data: { isSaleVersion: false },
        });
      }

      return tx.movisurVersion.create({
        data: {
          version,
          buildNumber,
          platform,
          releaseType,
          distribution,
          downloadUrl: finalDownloadUrl,
          uploadKey,
          fileName,
          fileSize,
          changelog,
          forceUpdate: false,
          isActive,
          isSaleVersion,
        },
      });
    });

    return NextResponse.json({ version: created }, { status: 201 });
  } catch (error) {
    console.error("Create Movisur version error", error);
    return NextResponse.json(
      { message: "No se pudo crear la version. Revisa si el build ya existe." },
      { status: 500 }
    );
  }
}
