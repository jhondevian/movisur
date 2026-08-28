import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import {
  getTelegramFileDownloadUrl,
  getTelegramFileInfo,
} from "@/lib/telegram-api";
import { getTelegramBotToken } from "@/lib/telegram-settings";

const defaultLargeFileThresholdMb = 300;
const bytesPerMb = 1024 * 1024;

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
  const baseSlug = slugify(name) || "telegram";
  let slug = baseSlug;
  let suffix = 2;

  while (await prisma.movisurProductFile.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function getFileType(fileKind: string, fileName: string | null) {
  if (fileKind === "video") return "video";
  if (fileName?.toLowerCase().endsWith(".zip")) return "zip";

  return "file";
}

async function downloadTelegramFile({
  fileId,
  fileName,
}: {
  fileId: string;
  fileName: string | null;
}) {
  const token = await getTelegramBotToken();

  if (!token) {
    throw new Error("Configura el token del bot de Telegram.");
  }

  const fileInfo = await getTelegramFileInfo(token, fileId);

  if (!fileInfo.file_path) {
    throw new Error("Telegram no entrego una ruta de descarga para este archivo.");
  }

  const response = await fetch(
    getTelegramFileDownloadUrl(token, fileInfo.file_path),
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("No se pudo descargar el archivo desde Telegram.");
  }

  const safeName = (fileName || path.basename(fileInfo.file_path)).replace(
    /[^a-zA-Z0-9._-]/g,
    "-"
  );
  const storedName = `${Date.now()}-${safeName}`;
  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "movisur",
    "products",
    "telegram"
  );

  await mkdir(uploadDir, { recursive: true });
  await writeFile(
    path.join(uploadDir, storedName),
    Buffer.from(await response.arrayBuffer())
  );

  return {
    downloadUrl: `/uploads/movisur/products/telegram/${storedName}`,
    distribution: "file" as const,
    fileSize: fileInfo.file_size ?? null,
    storedName,
  };
}

async function getTelegramDownloadReference({
  fileId,
  fileName,
  largeFileThresholdMb,
}: {
  fileId: string;
  fileName: string | null;
  largeFileThresholdMb: number;
}) {
  const token = await getTelegramBotToken();

  if (!token) {
    throw new Error("Configura el token del bot de Telegram.");
  }

  const fileInfo = await getTelegramFileInfo(token, fileId);
  const thresholdBytes = largeFileThresholdMb * bytesPerMb;
  const isLargeFile =
    typeof fileInfo.file_size === "number" && fileInfo.file_size > thresholdBytes;

  if (isLargeFile) {
    return {
      distribution: "url" as const,
      downloadUrl: `telegram:${fileId}`,
      fileSize: fileInfo.file_size ?? null,
      storedName: fileName,
    };
  }

  return downloadTelegramFile({ fileId, fileName });
}

export async function importTelegramFileToMovisur(telegramFileId: string) {
  return importTelegramFileToMovisurWithOwner(telegramFileId);
}

async function getDefaultAdminOwnerId() {
  const admin = await prisma.user.findFirst({
    where: { role: "admin" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  return admin?.id ?? null;
}

export async function importTelegramFileToMovisurWithOwner(
  telegramFileId: string,
  ownerId?: string | null
) {
  const telegramFile = await prisma.telegramFile.findUnique({
    where: { id: telegramFileId },
  });

  if (!telegramFile) {
    throw new Error("El archivo de Telegram no existe.");
  }

  if (telegramFile.importedFileId) {
    return { importedFileId: telegramFile.importedFileId, reused: true };
  }

  const settings = await prisma.telegramSettings.findUnique({
    where: { id: "default" },
    select: { largeFileThresholdMb: true },
  });
  const downloaded = await getTelegramDownloadReference({
    fileId: telegramFile.fileId,
    fileName: telegramFile.fileName,
    largeFileThresholdMb:
      settings?.largeFileThresholdMb ?? defaultLargeFileThresholdMb,
  });
  const name =
    telegramFile.fileName ||
    telegramFile.caption?.slice(0, 120) ||
    `Archivo Telegram ${telegramFile.messageId}`;
  const slug = await getUniqueSlug(name);
  const fileType = getFileType(telegramFile.fileKind, telegramFile.fileName);
  const fileSize = telegramFile.fileSize ?? downloaded.fileSize;
  const createdById = ownerId ?? (await getDefaultAdminOwnerId());

  const created = await prisma.$transaction(async (tx) => {
    const productFile = await tx.movisurProductFile.create({
      data: {
        description: telegramFile.caption || null,
        distribution: downloaded.distribution,
        downloadUrl: downloaded.downloadUrl,
        fileMimeType: telegramFile.fileMimeType,
        fileName: telegramFile.fileName || downloaded.storedName,
        fileSize,
        fileType,
        createdById,
        isActive: true,
        isForSale: false,
        name,
        slug,
        uploadKey: `telegram:${telegramFile.id}`,
      },
    });

    await tx.movisurProductFileRevision.create({
      data: {
        distribution: downloaded.distribution,
        downloadUrl: downloaded.downloadUrl,
        fileMimeType: telegramFile.fileMimeType,
        fileName: telegramFile.fileName || downloaded.storedName,
        fileSize,
        fileType,
        createdById,
        isCurrent: true,
        productFileId: productFile.id,
        versionNumber: 1,
      },
    });

    await tx.telegramFile.update({
      where: { id: telegramFile.id },
      data: {
        importedAt: new Date(),
        importedFileId: productFile.id,
        status: "imported",
      },
    });

    return productFile;
  });

  return { importedFileId: created.id, reused: false };
}
