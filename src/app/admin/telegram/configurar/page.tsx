import TelegramSettingsForm from "@/components/telegram/TelegramSettingsForm";
import {
  decryptTelegramToken,
  getTelegramSettings,
  getTelegramWebhookUrl,
  maskTelegramToken,
} from "@/lib/telegram-settings";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Configurar Telegram | Movisur",
  description: "Configura el bot y webhook de Telegram para importar archivos",
};

function formatDate(value: Date | null) {
  if (!value) return null;

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function AdminTelegramConfigurarPage() {
  const settings = await getTelegramSettings();
  const envToken = process.env.TELEGRAM_BOT_TOKEN?.trim() || "";
  const dbToken = decryptTelegramToken(settings.botTokenEncrypted);
  const token = envToken || dbToken;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Configurar Telegram
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
          Conecta un bot de Telegram para que Movisur reciba archivos desde tus
          canales o grupos y los deje listos para importarlos.
        </p>
      </div>

      <TelegramSettingsForm
        allowedChatIds={settings.allowedChatIds || ""}
        autoImport={settings.autoImport}
        botTokenMasked={
          envToken ? "Definido en TELEGRAM_BOT_TOKEN" : maskTelegramToken(token)
        }
        botUsername={settings.botUsername || ""}
        hasBotToken={Boolean(token)}
        largeFileThresholdMb={settings.largeFileThresholdMb}
        lastConnectionCheckAt={formatDate(settings.lastConnectionCheckAt)}
        lastWebhookSetAt={formatDate(settings.lastWebhookSetAt)}
        webhookSecret={settings.webhookSecret || ""}
        webhookUrl={getTelegramWebhookUrl()}
      />
    </div>
  );
}
