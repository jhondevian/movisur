import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/site-metadata";

const settingsId = "default";
const algorithm = "aes-256-gcm";

function getEncryptionKey() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is required to encrypt Telegram settings.");
  }

  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptTelegramToken(token: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [iv, tag, encrypted].map((part) => part.toString("base64")).join(".");
}

export function decryptTelegramToken(value: string | null | undefined) {
  if (!value) return "";

  const [ivText, tagText, encryptedText] = value.split(".");
  if (!ivText || !tagText || !encryptedText) return "";

  const decipher = crypto.createDecipheriv(
    algorithm,
    getEncryptionKey(),
    Buffer.from(ivText, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagText, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export function maskTelegramToken(token: string) {
  if (!token) return "";
  if (token.length <= 12) return "Configurado";

  return `${token.slice(0, 8)}...${token.slice(-6)}`;
}

export function getTelegramWebhookUrl() {
  return absoluteUrl("/api/telegram/webhook");
}

export async function getTelegramSettings() {
  return prisma.telegramSettings.upsert({
    where: { id: settingsId },
    update: {},
    create: { id: settingsId },
  });
}

export async function getTelegramBotToken() {
  const envToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (envToken) return envToken;

  const settings = await getTelegramSettings();
  return decryptTelegramToken(settings.botTokenEncrypted);
}

export function parseAllowedChatIds(value: string | null | undefined) {
  return new Set(
    (value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  );
}
