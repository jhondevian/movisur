"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type TelegramSettingsFormProps = {
  allowedChatIds: string;
  autoImport: boolean;
  botTokenMasked: string;
  botUsername: string;
  hasBotToken: boolean;
  largeFileThresholdMb: number;
  lastConnectionCheckAt: string | null;
  lastWebhookSetAt: string | null;
  webhookSecret: string;
  webhookUrl: string;
};

export default function TelegramSettingsForm({
  allowedChatIds,
  autoImport,
  botTokenMasked,
  botUsername,
  hasBotToken,
  largeFileThresholdMb,
  lastConnectionCheckAt,
  lastWebhookSetAt,
  webhookSecret,
  webhookUrl,
}: TelegramSettingsFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    allowedChatIds,
    autoImport,
    botToken: "",
    botUsername,
    largeFileThresholdMb: String(largeFileThresholdMb),
    webhookSecret,
  });
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  function updateField(key: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function saveSettings(registerWebhook = false) {
    setMessage("");
    registerWebhook ? setIsRegistering(true) : setIsSaving(true);

    const response = await fetch("/api/admin/telegram/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, registerWebhook }),
    });

    setIsSaving(false);
    setIsRegistering(false);

    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;

    if (!response.ok) {
      setMessage(payload?.message ?? "No se pudo guardar la configuracion.");
      return;
    }

    setForm((current) => ({ ...current, botToken: "" }));
    setMessage(
      payload?.message ??
        (registerWebhook ? "Webhook registrado." : "Configuracion guardada.")
    );
    router.refresh();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveSettings(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Token del bot
          </span>
          <input
            type="password"
            value={form.botToken}
            onChange={(event) => updateField("botToken", event.target.value)}
            placeholder={
              hasBotToken ? botTokenMasked : "Token entregado por BotFather"
            }
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
          />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Se guarda cifrado con AUTH_SECRET. Dejelo vacio para conservar el
            token actual.
          </p>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Usuario del bot
          </span>
          <input
            type="text"
            value={form.botUsername}
            onChange={(event) => updateField("botUsername", event.target.value)}
            placeholder="movisur_import_bot"
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Secreto del webhook
          </span>
          <input
            type="text"
            value={form.webhookSecret}
            onChange={(event) =>
              updateField("webhookSecret", event.target.value)
            }
            placeholder="Clave privada para validar Telegram"
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Limite para URL temporal
          </span>
          <div className="flex h-11 overflow-hidden rounded-lg border border-gray-300 bg-white shadow-theme-xs focus-within:border-brand-300 focus-within:ring-3 focus-within:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950">
            <input
              type="number"
              min="1"
              step="1"
              value={form.largeFileThresholdMb}
              onChange={(event) =>
                updateField("largeFileThresholdMb", event.target.value)
              }
              className="w-full border-0 bg-transparent px-4 py-2.5 text-sm text-gray-800 outline-hidden dark:text-white/90"
            />
            <span className="flex items-center border-l border-gray-200 px-3 text-sm font-medium text-gray-500 dark:border-gray-800 dark:text-gray-400">
              MB
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Los archivos mayores a este peso se guardaran como enlace temporal
            de Telegram.
          </p>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Chats permitidos
          </span>
          <input
            type="text"
            value={form.allowedChatIds}
            onChange={(event) =>
              updateField("allowedChatIds", event.target.value)
            }
            placeholder="-1001234567890, -1009876543210"
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
          />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Opcional. Si queda vacio, Movisur aceptara archivos de cualquier
            chat donde este el bot.
          </p>
        </label>

        <div className="lg:col-span-2">
          <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
            URL del webhook
          </p>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            {webhookUrl}
          </div>
        </div>

        <label className="flex items-center gap-3 lg:col-span-2">
          <input
            type="checkbox"
            checked={form.autoImport}
            onChange={(event) =>
              updateField("autoImport", event.target.checked)
            }
            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Importar automaticamente los archivos recibidos
          </span>
        </label>
      </div>

      <div className="mt-6 grid gap-3 rounded-xl bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-900 dark:text-gray-300 sm:grid-cols-2">
        <p>
          Ultima prueba:{" "}
          <span className="font-medium">
            {lastConnectionCheckAt || "Pendiente"}
          </span>
        </p>
        <p>
          Webhook registrado:{" "}
          <span className="font-medium">{lastWebhookSetAt || "Pendiente"}</span>
        </p>
      </div>

      {message && (
        <div className="mt-5 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:bg-white/[0.03] dark:text-gray-300">
          {message}
        </div>
      )}

      <div className="mt-7 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSaving || isRegistering}
          className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
        >
          {isSaving ? "Guardando..." : "Guardar configuracion"}
        </button>
        <button
          type="button"
          disabled={isSaving || isRegistering}
          onClick={() => saveSettings(true)}
          className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
        >
          {isRegistering ? "Registrando..." : "Registrar webhook"}
        </button>
      </div>
    </form>
  );
}
