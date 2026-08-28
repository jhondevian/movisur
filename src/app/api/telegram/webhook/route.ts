import { prisma } from "@/lib/prisma";
import {
  getTelegramSettings,
  parseAllowedChatIds,
} from "@/lib/telegram-settings";
import { importTelegramFileToMovisur } from "@/lib/telegram-import";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type TelegramChat = {
  id: number | string;
  title?: string;
  username?: string;
  first_name?: string;
};

type TelegramFilePayload = {
  file_id: string;
  file_unique_id: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
};

type TelegramMessage = {
  message_id: number;
  date?: number;
  chat: TelegramChat;
  caption?: string;
  document?: TelegramFilePayload;
  video?: TelegramFilePayload;
  audio?: TelegramFilePayload;
};

type TelegramUpdate = {
  message?: TelegramMessage;
  channel_post?: TelegramMessage;
};

function pickFile(message: TelegramMessage) {
  if (message.document) return { file: message.document, kind: "document" };
  if (message.video) return { file: message.video, kind: "video" };
  if (message.audio) return { file: message.audio, kind: "audio" };

  return null;
}

function getChatTitle(chat: TelegramChat) {
  return chat.title || chat.username || chat.first_name || null;
}

export async function POST(request: NextRequest) {
  const settings = await getTelegramSettings();
  const expectedSecret =
    settings.webhookSecret || process.env.TELEGRAM_WEBHOOK_SECRET;
  const receivedSecret = request.headers.get("x-telegram-bot-api-secret-token");

  if (expectedSecret && receivedSecret !== expectedSecret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = (await request.json().catch(() => null)) as
    | TelegramUpdate
    | null;
  const message = update?.message || update?.channel_post;

  if (!message) {
    return NextResponse.json({ ok: true });
  }

  const selected = pickFile(message);

  if (!selected) {
    return NextResponse.json({ ok: true });
  }

  const chatId = String(message.chat.id);
  const allowedChatIds = parseAllowedChatIds(settings.allowedChatIds);

  if (allowedChatIds.size > 0 && !allowedChatIds.has(chatId)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const savedFile = await prisma.telegramFile.upsert({
    where: {
      chatId_messageId_fileUniqueId: {
        chatId,
        messageId: message.message_id,
        fileUniqueId: selected.file.file_unique_id,
      },
    },
    update: {
      caption: message.caption || null,
      fileId: selected.file.file_id,
      fileName: selected.file.file_name || null,
      fileSize:
        selected.file.file_size === undefined
          ? null
          : BigInt(selected.file.file_size),
      fileMimeType: selected.file.mime_type || null,
    },
    create: {
      caption: message.caption || null,
      chatId,
      chatTitle: getChatTitle(message.chat),
      fileId: selected.file.file_id,
      fileKind: selected.kind,
      fileName: selected.file.file_name || null,
      fileSize:
        selected.file.file_size === undefined
          ? null
          : BigInt(selected.file.file_size),
      fileMimeType: selected.file.mime_type || null,
      fileUniqueId: selected.file.file_unique_id,
      messageId: message.message_id,
      receivedAt: message.date ? new Date(message.date * 1000) : new Date(),
      status: "pending",
    },
  });

  if (settings.autoImport && !savedFile.importedFileId) {
    await importTelegramFileToMovisur(savedFile.id).catch((error) => {
      console.error("Telegram auto import error", error);
    });
  }

  return NextResponse.json({ ok: true });
}
