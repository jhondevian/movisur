import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";

type TelegramApiResponse<T> = {
  ok: boolean;
  result?: T;
  description?: string;
};

const defaultTelegramApiBaseUrl = "https://api.telegram.org";
const defaultTelegramLocalFileRoot = "/var/lib/telegram-bot-api";

function getTelegramApiBaseUrl() {
  return (
    process.env.TELEGRAM_API_BASE_URL?.trim().replace(/\/+$/, "") ||
    defaultTelegramApiBaseUrl
  );
}

export type TelegramBotInfo = {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
};

export type TelegramFileInfo = {
  file_id: string;
  file_unique_id: string;
  file_path?: string;
  file_size?: number;
};

async function telegramRequest<T>(
  token: string,
  method: string,
  body?: Record<string, unknown>
) {
  const response = await fetch(`${getTelegramApiBaseUrl()}/bot${token}/${method}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as
    | TelegramApiResponse<T>
    | null;

  if (!response.ok || !payload?.ok) {
    throw new Error(
      payload?.description || `Telegram respondio con estado ${response.status}.`
    );
  }

  return payload.result as T;
}

export function getTelegramBotInfo(token: string) {
  return telegramRequest<TelegramBotInfo>(token, "getMe");
}

export function setTelegramWebhook({
  allowedUpdates = ["message", "channel_post"],
  secretToken,
  token,
  url,
}: {
  allowedUpdates?: string[];
  secretToken: string;
  token: string;
  url: string;
}) {
  return telegramRequest<boolean>(token, "setWebhook", {
    allowed_updates: allowedUpdates,
    drop_pending_updates: false,
    secret_token: secretToken,
    url,
  });
}

export function getTelegramFileInfo(token: string, fileId: string) {
  return telegramRequest<TelegramFileInfo>(token, "getFile", {
    file_id: fileId,
  });
}

export function getTelegramFileDownloadUrl(token: string, filePath: string) {
  if (/^https?:\/\//i.test(filePath)) return filePath;

  const normalizedPath = filePath.replace(/\\/g, "/");
  const fileSegment = normalizedPath.startsWith("/")
    ? `/file/bot${token}${normalizedPath}`
    : `/file/bot${token}/${normalizedPath}`;

  return `${getTelegramApiBaseUrl()}${fileSegment}`;
}

export async function getTemporaryTelegramDownloadUrl(
  token: string,
  fileId: string
) {
  const fileInfo = await getTelegramFileInfo(token, fileId);

  if (!fileInfo.file_path) {
    throw new Error("Telegram no entrego una ruta de descarga para este archivo.");
  }

  return getTelegramFileDownloadUrl(token, fileInfo.file_path);
}

export async function fetchTemporaryTelegramFile(token: string, fileId: string) {
  const fileInfo = await getTelegramFileInfo(token, fileId);

  if (!fileInfo.file_path) {
    throw new Error("Telegram no entrego una ruta de descarga para este archivo.");
  }

  if (path.isAbsolute(fileInfo.file_path)) {
    const localRoot = path.resolve(
      process.env.TELEGRAM_LOCAL_FILE_ROOT?.trim() || defaultTelegramLocalFileRoot
    );
    const filePath = path.resolve(fileInfo.file_path);

    if (!filePath.startsWith(`${localRoot}${path.sep}`)) {
      throw new Error("Telegram entrego una ruta local no permitida.");
    }

    const fileStat = await stat(filePath);
    const body = Readable.toWeb(createReadStream(filePath));

    return new Response(body as BodyInit, {
      headers: {
        "Content-Length": String(fileStat.size),
        "Content-Type": "application/octet-stream",
      },
    });
  }

  const downloadUrl = getTelegramFileDownloadUrl(token, fileInfo.file_path);
  const response = await fetch(downloadUrl, { cache: "no-store" });

  if (!response.ok || !response.body) {
    throw new Error("No se pudo abrir el archivo temporal de Telegram.");
  }

  return response;
}
