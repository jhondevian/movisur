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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const currentVersion = await prisma.movisurVersion.findUnique({
    where: { id },
  });

  if (!currentVersion) {
    return NextResponse.json(
      { message: "La version no existe." },
      { status: 404 }
    );
  }

  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return NextResponse.json(
      {
        message:
          "El archivo es demasiado grande para el limite actual del servidor. Aumenta el limite de carga o usa URL de descarga.",
      },
      { status: 413 }
    );
  }
  const version = getString(formData, "version");
  const releaseType = getString(formData, "releaseType") || "stable";
  const changelog = getString(formData, "changelog");
  const downloadUrl = getString(formData, "downloadUrl");
  const file = formData.get("file");
  const isActive = getBoolean(formData, "isActive");
  const isSaleVersion = getBoolean(formData, "isSaleVersion");

  if (!version) {
    return NextResponse.json(
      { message: "La version es obligatoria." },
      { status: 400 }
    );
  }

  if (!isValidValue(releaseTypes, releaseType)) {
    return NextResponse.json(
      { message: "Selecciona un tipo de release valido." },
      { status: 400 }
    );
  }

  let finalDownloadUrl = currentVersion.downloadUrl;
  let fileName = currentVersion.fileName;
  let fileSize = currentVersion.fileSize;
  let distribution = currentVersion.distribution;

  if (file instanceof File && file.size > 0) {
    if (!file.name.toLowerCase().endsWith(".zip")) {
      return NextResponse.json(
        { message: "Solo se permite subir archivos .zip." },
        { status: 400 }
      );
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const storedName = `${Date.now()}-${safeName}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "movisur");

    await mkdir(uploadDir, { recursive: true });
    await writeFile(
      path.join(uploadDir, storedName),
      Buffer.from(await file.arrayBuffer())
    );

    finalDownloadUrl = `/uploads/movisur/${storedName}`;
    fileName = file.name;
    fileSize = file.size;
    distribution = "file";
  } else if (downloadUrl) {
    finalDownloadUrl = downloadUrl;
    fileName = null;
    fileSize = null;
    distribution = "url";
  }

  if (!finalDownloadUrl) {
    return NextResponse.json(
      { message: "Agrega una URL de descarga o sube un archivo ZIP." },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      if (isSaleVersion) {
        await tx.movisurVersion.updateMany({
          where: {
            isSaleVersion: true,
            id: { not: id },
          },
          data: { isSaleVersion: false },
        });
      }

      return tx.movisurVersion.update({
        where: { id },
        data: {
          version,
          releaseType,
          distribution,
          downloadUrl: finalDownloadUrl,
          fileName,
          fileSize,
          changelog,
          isActive,
          isSaleVersion,
        },
      });
    });

    return NextResponse.json({ version: updated });
  } catch (error) {
    console.error("Update Movisur version error", error);
    return NextResponse.json(
      { message: "No se pudo actualizar la version." },
      { status: 500 }
    );
  }
}
