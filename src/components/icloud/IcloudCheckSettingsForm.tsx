"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type IcloudServiceOption = {
  id: string;
  name: string;
};

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
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [services, setServices] = useState<IcloudServiceOption[]>([]);
  const [rawServices, setRawServices] = useState("");

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

  function collectServices(value: unknown): IcloudServiceOption[] {
    if (Array.isArray(value)) {
      return value.flatMap((item) => collectServices(item));
    }

    if (!value || typeof value !== "object") {
      return [];
    }

    const record = value as Record<string, unknown>;
    const idValue =
      record.id || record.service || record.service_id || record.serviceId;
    const nameValue =
      record.name || record.service_name || record.serviceName || record.title;

    if (
      (typeof idValue === "string" || typeof idValue === "number") &&
      typeof nameValue === "string"
    ) {
      return [{ id: String(idValue), name: nameValue }];
    }

    return Object.values(record).flatMap((item) => collectServices(item));
  }

  function collectServicesFromHtml(value: string): IcloudServiceOption[] {
    const options = [...value.matchAll(/value=["']?(\d+)["']?[^>]*>([^<]+)/gi)]
      .map((match) => ({
        id: match[1],
        name: match[2].replace(/\s+/g, " ").trim(),
      }))
      .filter((item) => item.id && item.name);

    if (options.length > 0) return options;

    return [...value.matchAll(/\b(\d{2,})\b\s*[-:]\s*([^\n\r<]+)/g)]
      .map((match) => ({
        id: match[1],
        name: match[2].replace(/\s+/g, " ").trim(),
      }))
      .filter((item) => item.id && item.name);
  }

  async function loadServices() {
    setMessage("");
    setRawServices("");
    setServices([]);
    setIsLoadingServices(true);

    const response = await fetch("/api/admin/icloud-check/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiBaseUrl: form.apiBaseUrl,
        apiKey: form.apiKey,
      }),
    });
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
      services?: unknown;
    } | null;

    setIsLoadingServices(false);

    if (!response.ok) {
      setMessage(payload?.message ?? "No se pudo cargar servicios.");
      return;
    }

    const result = payload?.services;
    const responseValue =
      result &&
      typeof result === "object" &&
      !Array.isArray(result) &&
      "response" in result
        ? (result as { response?: unknown }).response
        : result;
    const parsedServices =
      typeof responseValue === "string"
        ? collectServicesFromHtml(responseValue)
        : collectServices(responseValue);

    setServices(parsedServices);
    setRawServices(
      typeof responseValue === "string"
        ? responseValue
        : JSON.stringify(responseValue, null, 2)
    );
    setMessage(
      parsedServices.length > 0
        ? "Servicios cargados. Selecciona el ID correcto."
        : "Servicios cargados. Revisa la respuesta y copia el ID del servicio."
    );
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

        <div className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Service ID
          </span>
          <div className="flex gap-3">
            <input
              value={form.serviceId}
              onChange={(event) => updateField("serviceId", event.target.value)}
              placeholder="Ejemplo: 1000"
              className="h-11 min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
            />
            <button
              type="button"
              onClick={loadServices}
              disabled={isLoadingServices}
              className="h-11 shrink-0 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
            >
              {isLoadingServices ? "Cargando..." : "Cargar servicios"}
            </button>
          </div>
        </div>

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

      {services.length > 0 ? (
        <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            Servicios disponibles
          </p>
          <div className="grid max-h-72 gap-2 overflow-auto">
            {services.map((service) => (
              <button
                key={`${service.id}-${service.name}`}
                type="button"
                onClick={() => updateField("serviceId", service.id)}
                className={`rounded-lg border px-4 py-3 text-left text-sm transition ${
                  form.serviceId === service.id
                    ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300"
                }`}
              >
                <span className="font-semibold">{service.id}</span>
                <span className="ml-2">{service.name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {rawServices && services.length === 0 ? (
        <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            Respuesta de servicios
          </p>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-white p-4 text-xs leading-5 text-gray-700 dark:bg-gray-950 dark:text-gray-300">
            {rawServices}
          </pre>
        </div>
      ) : null}

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
