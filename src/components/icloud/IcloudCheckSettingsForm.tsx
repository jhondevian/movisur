"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type IcloudCheckSettingsFormProps = {
  apiBaseUrl: string;
  apiKeyMasked: string;
  hasApiKey: boolean;
  isEnabled: boolean;
  lastConnectionAt: string | null;
  serviceId: string;
};

export default function IcloudCheckSettingsForm({
  apiBaseUrl,
  apiKeyMasked,
  hasApiKey,
  isEnabled,
  lastConnectionAt,
  serviceId,
}: IcloudCheckSettingsFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    apiBaseUrl,
    apiKey: "",
    isEnabled,
    serviceId,
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(key: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const response = await fetch("/api/admin/icloud-check/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;

    setIsSubmitting(false);

    if (!response.ok) {
      setMessage(payload?.message ?? "No se pudo guardar iCloud Check.");
      return;
    }

    setForm((current) => ({ ...current, apiKey: "" }));
    setMessage(payload?.message ?? "iCloud Check actualizado.");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        iCloud Check Free
      </h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Configura la API de iFreeiCloud para consultar IMEI o serial desde el
        frontend sin exponer la API key.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            API key
          </span>
          <input
            type="password"
            value={form.apiKey}
            onChange={(event) => updateField("apiKey", event.target.value)}
            placeholder={hasApiKey ? apiKeyMasked : "API key de iFreeiCloud"}
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
          />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Dejelo vacio para conservar la clave actual.
          </p>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Service ID
          </span>
          <input
            value={form.serviceId}
            onChange={(event) => updateField("serviceId", event.target.value)}
            placeholder="Ejemplo: 1000"
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
          />
        </label>

        <label className="block lg:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            API base URL
          </span>
          <input
            type="url"
            value={form.apiBaseUrl}
            onChange={(event) => updateField("apiBaseUrl", event.target.value)}
            placeholder="https://api.ifreeicloud.co.uk"
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
          />
        </label>

        <label className="flex items-center gap-3 lg:col-span-2">
          <input
            type="checkbox"
            checked={form.isEnabled}
            onChange={(event) => updateField("isEnabled", event.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Activar consulta publica en iCloud Check Free
          </span>
        </label>
      </div>

      <div className="mt-6 rounded-xl bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-900 dark:text-gray-300">
        Ultima actualizacion:{" "}
        <span className="font-medium">{lastConnectionAt || "Pendiente"}</span>
      </div>

      {message ? (
        <div className="mt-5 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:bg-white/[0.03] dark:text-gray-300">
          {message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-7 rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
      >
        {isSubmitting ? "Guardando..." : "Guardar iCloud Check"}
      </button>
    </form>
  );
}
