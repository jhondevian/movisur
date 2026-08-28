import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const settingsId = "default";
const algorithm = "aes-256-gcm";
const defaultApiBaseUrl = "https://api.ifreeicloud.co.uk";

function getEncryptionKey() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is required to encrypt iCloud API settings.");
  }

  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptIcloudApiKey(apiKey: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(apiKey, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [iv, tag, encrypted].map((part) => part.toString("base64")).join(".");
}

export function decryptIcloudApiKey(value: string | null | undefined) {
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

export function maskIcloudApiKey(apiKey: string) {
  if (!apiKey) return "";
  if (apiKey.length <= 12) return "Configurada";

  return `${apiKey.slice(0, 7)}...${apiKey.slice(-5)}`;
}

export async function getIcloudCheckSettings() {
  return prisma.icloudCheckSettings.upsert({
    where: { id: settingsId },
    update: {},
    create: { id: settingsId },
  });
}

export async function getIcloudApiKey() {
  const envKey = process.env.IFREEICLOUD_API_KEY?.trim();
  if (envKey) return envKey;

  const settings = await getIcloudCheckSettings();
  return decryptIcloudApiKey(settings.apiKeyEncrypted);
}

export function normalizeIcloudIdentifier(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export async function runIcloudCheck(identifier: string) {
  const settings = await getIcloudCheckSettings();
  const apiKey = await getIcloudApiKey();
  const serviceId = settings.serviceId?.trim();

  if (!settings.isEnabled) {
    throw new Error("El iCloud Check no esta activo.");
  }

  if (!apiKey) {
    throw new Error("Configura la API key de iFreeiCloud.");
  }

  if (!serviceId) {
    throw new Error("Configura el Service ID de iFreeiCloud.");
  }

  const apiBaseUrl = settings.apiBaseUrl || defaultApiBaseUrl;
  const response = await fetch(apiBaseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      imei: identifier,
      key: apiKey,
      service: serviceId,
    }),
    cache: "no-store",
  });
  const text = await response.text();
  let parsed: unknown = text;

  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }

  await prisma.icloudCheckLookup.create({
    data: {
      identifier,
      response: typeof parsed === "string" ? parsed : JSON.stringify(parsed),
      serviceId,
      status: response.ok ? "completed" : "failed",
    },
  });

  if (!response.ok) {
    throw new Error(`iFreeiCloud respondio con estado ${response.status}.`);
  }

  return parsed;
}
