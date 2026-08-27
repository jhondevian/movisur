import { requireAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export const runtime = "nodejs";

const allowedImageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const allowedFileTypes = new Set(["url", "zip", "file", "video"]);
const allowedVideoTypes = new Set(["video/mp4", "video/webm", "video/quicktime"]);

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function normalizeFileType(value: string) {
  return allowedFileTypes.has(value) ? value : "zip";
}

async function saveUploadedProductFile(file: File, fileType: string) {
  if (fileType === "zip" && !file.name.toLowerCase().endsWith(".zip")) {
    throw new Error("Solo se permite subir archivos .zip en esta opcion.");
  }

  if (fileType === "video" && !allowedVideoTypes.has(file.type)) {
    throw new Error("Solo se permiten videos MP4, WebM o MOV.");
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const storedName = `${Date.now()}-${safeName}`;
  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "movisur",
    "products"
  );

  await mkdir(uploadDir, { recursive: true });
  await writeFile(
    path.join(uploadDir, storedName),
    Buffer.from(await file.arrayBuffer())
  );

  return {
    downloadUrl: `/uploads/movisur/products/${storedName}`,
    fileName: file.name,
    fileSize: file.size,
    fileMimeType: file.type || null,
    distribution: "file" as const,
  };
}

async function saveProductImage(file: File) {
  if (!allowedImageTypes.has(file.type)) {
    throw new Error("Solo se permiten imagenes PNG, JPG o WebP.");
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error("La imagen no debe superar 2 MB.");
  }

  const extension =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const fileName = `product-${Date.now()}.${extension}`;
  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "movisur",
    "products",
    "images"
  );

  await mkdir(uploadDir, { recursive: true });
  await writeFile(
    path.join(uploadDir, fileName),
    Buffer.from(await file.arrayBuffer())
  );

  return `/uploads/movisur/products/images/${fileName}`;
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
  const currentFile = await prisma.movisurProductFile.findUnique({
    where: { id },
  });

  if (!currentFile) {
    return NextResponse.json(
      { message: "El archivo no existe." },
      { status: 404 }
    );
  }

  if (user.role === "creador" && currentFile.createdById !== user.id) {
    return NextResponse.json(
      { message: "No puedes editar archivos de otro usuario." },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const name = getString(formData, "name");
  const categoryId = getString(formData, "categoryId");
  const description = getString(formData, "description");
  const downloadUrl = getString(formData, "downloadUrl");
  const createdById = getString(formData, "createdById");
  const fileType = normalizeFileType(getString(formData, "fileType"));
  const file = formData.get("file");
  const image = formData.get("image");
  const isActive = getBoolean(formData, "isActive");
  const isForSale = getBoolean(formData, "isForSale");
  const sortOrder = Number.parseInt(getString(formData, "sortOrder"), 10) || 0;

  if (!name) {
    return NextResponse.json(
      { message: "El nombre del producto es obligatorio." },
      { status: 400 }
    );
  }

  let finalDownloadUrl = currentFile.downloadUrl;
  let fileName = currentFile.fileName;
  let fileSize = currentFile.fileSize;
  let fileMimeType = currentFile.fileMimeType;
  let imageUrl = currentFile.imageUrl;
  let distribution = currentFile.distribution;
  let shouldCreateRevision = false;

  try {
    if (image instanceof File && image.size > 0) {
      imageUrl = await saveProductImage(image);
    }

    if (file instanceof File && file.size > 0) {
      const savedFile = await saveUploadedProductFile(file, fileType);
      finalDownloadUrl = savedFile.downloadUrl;
      fileName = savedFile.fileName;
      fileSize = savedFile.fileSize;
      fileMimeType = savedFile.fileMimeType;
      distribution = savedFile.distribution;
      shouldCreateRevision = true;
    } else if (downloadUrl) {
      shouldCreateRevision =
        downloadUrl !== currentFile.downloadUrl ||
        fileType !== currentFile.fileType ||
        currentFile.distribution !== "url";
      finalDownloadUrl = downloadUrl;
      fileName = null;
      fileSize = null;
      fileMimeType = null;
      distribution = "url";
    }
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Archivo invalido." },
      { status: 400 }
    );
  }

  if (!finalDownloadUrl) {
    return NextResponse.json(
      { message: "Agrega una URL de descarga o sube un archivo ZIP." },
      { status: 400 }
    );
  }

  if (createdById && user.role === "admin") {
    const owner = await prisma.user.findUnique({
      where: { id: createdById },
      select: { id: true },
    });

    if (!owner) {
      return NextResponse.json(
        { message: "El propietario seleccionado no existe." },
        { status: 400 }
      );
    }
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      if (shouldCreateRevision) {
        const latestRevision = await tx.movisurProductFileRevision.findFirst({
          where: { productFileId: id },
          orderBy: { versionNumber: "desc" },
          select: { versionNumber: true },
        });

        await tx.movisurProductFileRevision.updateMany({
          where: { productFileId: id },
          data: { isCurrent: false },
        });

        await tx.movisurProductFileRevision.create({
          data: {
            productFileId: id,
            versionNumber: (latestRevision?.versionNumber ?? 0) + 1,
            distribution,
            downloadUrl: finalDownloadUrl,
            fileType,
            fileMimeType,
            fileName,
            fileSize,
            isCurrent: true,
            createdById: user.id,
          },
        });
      }

      return tx.movisurProductFile.update({
        where: { id },
        data: {
          name,
          categoryId: categoryId || null,
          description,
          imageUrl,
          distribution,
          downloadUrl: finalDownloadUrl,
          fileType: shouldCreateRevision ? fileType : currentFile.fileType,
          fileMimeType,
          fileName,
          fileSize,
          isActive,
          isForSale,
          sortOrder,
          ...(user.role === "admin" ? { createdById: createdById || null } : {}),
        },
      });
    });

    return NextResponse.json({ file: updated });
  } catch (error) {
    console.error("Update Movisur product file error", error);
    return NextResponse.json(
      { message: "No se pudo actualizar el archivo." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const currentFile = await prisma.movisurProductFile.findUnique({
    where: { id },
    select: {
      id: true,
      createdById: true,
      deletedAt: true,
    },
  });

  if (!currentFile) {
    return NextResponse.json(
      { message: "El archivo no existe." },
      { status: 404 }
    );
  }

  if (user.role === "creador" && currentFile.createdById !== user.id) {
    return NextResponse.json(
      { message: "No puedes eliminar archivos de otro usuario." },
      { status: 403 }
    );
  }

  if (currentFile.deletedAt) {
    return NextResponse.json({ file: currentFile, reused: true });
  }

  const deleted = await prisma.movisurProductFile.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletedById: user.id,
      isActive: false,
    },
  });

  return NextResponse.json({ file: deleted });
}
