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

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);
}

async function getUniqueSlug(name: string) {
  const baseSlug = slugify(name) || "archivo";
  let slug = baseSlug;
  let suffix = 2;

  while (await prisma.movisurProductFile.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
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
    fileSize: BigInt(file.size),
    fileMimeType: file.type || null,
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

export async function POST(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const name = getString(formData, "name");
  const categoryId = getString(formData, "categoryId");
  const deviceModelId = getString(formData, "deviceModelId");
  const description = getString(formData, "description");
  const downloadUrl = getString(formData, "downloadUrl");
  const firmwareYearValue = Number.parseInt(getString(formData, "firmwareYear"), 10);
  const firmwareRegion = getString(formData, "firmwareRegion");
  const firmwareBuild = getString(formData, "firmwareBuild");
  const androidVersion = getString(formData, "androidVersion");
  const binaryVersion = getString(formData, "binaryVersion");
  const fileType = normalizeFileType(getString(formData, "fileType"));
  const uploadKey = getString(formData, "uploadKey");
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

  if (!uploadKey) {
    return NextResponse.json(
      { message: "No se pudo identificar la subida. Intenta otra vez." },
      { status: 400 }
    );
  }

  const existingUpload = await prisma.movisurProductFile.findUnique({
    where: { uploadKey },
  });

  if (existingUpload) {
    return NextResponse.json({ file: existingUpload, reused: true });
  }

  let finalDownloadUrl = downloadUrl;
  let fileName: string | null = null;
  let fileSize: bigint | null = null;
  let fileMimeType: string | null = null;
  let imageUrl: string | null = null;
  let distribution: "url" | "file" = "url";

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
      distribution = "file";
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

  try {
    const slug = await getUniqueSlug(name);
    const created = await prisma.$transaction(async (tx) => {
      const productFile = await tx.movisurProductFile.create({
        data: {
          name,
          slug,
          categoryId: categoryId || null,
          deviceModelId: deviceModelId || null,
          description,
          imageUrl,
          distribution,
          downloadUrl: finalDownloadUrl,
          uploadKey,
          createdById: user.id,
          fileType,
          fileMimeType,
          fileName,
          fileSize,
          firmwareYear: Number.isFinite(firmwareYearValue)
            ? firmwareYearValue
            : null,
          firmwareRegion: firmwareRegion || null,
          firmwareBuild: firmwareBuild || null,
          androidVersion: androidVersion || null,
          binaryVersion: binaryVersion || null,
          isActive,
          isForSale,
          sortOrder,
        },
      });

      await tx.movisurProductFileRevision.create({
        data: {
          productFileId: productFile.id,
          versionNumber: 1,
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

      return productFile;
    });

    return NextResponse.json({ file: created }, { status: 201 });
  } catch (error) {
    console.error("Create Movisur product file error", error);
    return NextResponse.json(
      { message: "No se pudo crear el archivo." },
      { status: 500 }
    );
  }
}
