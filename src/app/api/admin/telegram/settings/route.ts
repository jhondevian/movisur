import { requireAdminUser } from "@/lib/admin-auth";
import { getTelegramBotInfo, setTelegramWebhook } from "@/lib/telegram-api";
import {
  decryptTelegramToken,
  encryptTelegramToken,
  getTelegramSettings,
  getTelegramWebhookUrl,
} from "@/lib/telegram-settings";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type TelegramSettingsPayload = {
  allowedChatIds?: string;
  autoImport?: boolean;
  botToken?: string;
  botUsername?: string;
  largeFileThresholdMb?: string | number;
  registerWebhook?: boolean;
  webhookSecret?: string;
};

export async function POST(request: NextRequest) {
  const admin = await requireAdminUser();

  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as
    | TelegramSettingsPayload
    | null;

  if (!payload) {
    return NextResponse.json(
      { message: "Configuracion invalida." },
      { status: 400 }
    );
  }

  const current = await getTelegramSettings();
  const token = payload.botToken?.trim();
  const existingToken = decryptTelegramToken(current.botTokenEncrypted);
  const finalToken = token || process.env.TELEGRAM_BOT_TOKEN || existingToken;
  const webhookSecret = String(payload.webhookSecret || "").trim();
  const largeFileThresholdMb = Math.max(
    1,
    Math.floor(Number(payload.largeFileThresholdMb) || 300)
  );

  if (!finalToken) {
    return NextResponse.json(
      { message: "Agrega el token del bot de Telegram." },
      { status: 400 }
    );
  }

  if (!webhookSecret) {
    return NextResponse.json(
      { message: "Agrega un secreto para validar el webhook." },
      { status: 400 }
    );
  }

  try {
    const bot = await getTelegramBotInfo(finalToken);
    const now = new Date();
    let webhookRegistered = false;

    if (payload.registerWebhook) {
      await setTelegramWebhook({
        secretToken: webhookSecret,
        token: finalToken,
        url: getTelegramWebhookUrl(),
      });
      webhookRegistered = true;
    }

    await prisma.telegramSettings.update({
      where: { id: current.id },
      data: {
        allowedChatIds: String(payload.allowedChatIds || "").trim() || null,
        autoImport: Boolean(payload.autoImport),
        botTokenEncrypted: token
          ? encryptTelegramToken(token)
          : current.botTokenEncrypted,
        largeFileThresholdMb,
        botUsername:
          String(payload.botUsername || "").trim() || bot.username || null,
        lastConnectionCheckAt: now,
        lastWebhookSetAt: webhookRegistered ? now : current.lastWebhookSetAt,
        webhookSecret,
      },
    });

    return NextResponse.json({
      message: webhookRegistered
        ? "Configuracion guardada y webhook registrado."
        : "Configuracion guardada. Conexion con Telegram verificada.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "No se pudo conectar con Telegram.",
      },
      { status: 400 }
    );
  }
}
