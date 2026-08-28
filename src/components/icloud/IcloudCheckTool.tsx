"use client";

import { FormEvent, useState } from "react";

type IcloudResultObject = Record<string, unknown>;

function isResultObject(value: unknown): value is IcloudResultObject {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getStringValue(result: IcloudResultObject, keys: string[]) {
  for (const key of keys) {
    const value = result[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }

  return "";
}

function getResultEntries(result: IcloudResultObject) {
  const hiddenKeys = new Set([
    "success",
    "status",
    "error",
    "message",
    "title",
    "model",
    "modelName",
    "device",
    "deviceName",
  ]);

  return Object.entries(result).filter(([key, value]) => {
    if (hiddenKeys.has(key)) return false;
    if (value === null || value === undefined || value === "") return false;
    if (typeof value === "object") return false;

    return true;
  });
}

function humanizeKey(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function IcloudResultCard({ result }: { result: unknown }) {
  const checkedAt = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());

  if (typeof result === "string") {
    return (
      <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-800 dark:bg-gray-900">
        <p className="whitespace-pre-wrap text-base leading-7 text-gray-700 dark:text-gray-300">
          {result}
        </p>
        <div className="mt-6 border-t border-gray-200 pt-5 dark:border-gray-800">
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {checkedAt}
          </p>
          <p className="mt-1 text-xs text-gray-400">Movisur</p>
        </div>
      </div>
    );
  }

  if (!isResultObject(result)) return null;

  const error = getStringValue(result, ["error", "message"]);
  const status = getStringValue(result, ["status"]);
  const success = result.success;

  if (success === false || error) {
    return (
      <div className="mt-6 rounded-xl border border-error-200 bg-error-50 px-4 py-4 text-sm leading-6 text-error-600 dark:border-error-500/30 dark:bg-error-500/10">
        <p className="font-semibold">Consulta rechazada</p>
        <p className="mt-1">{error || status || "El proveedor rechazo la consulta."}</p>
      </div>
    );
  }

  const title =
    getStringValue(result, ["title", "model", "modelName", "device", "deviceName"]) ||
    "Resultado iCloud Check";
  const entries = getResultEntries(result);

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-white text-brand-500 shadow-theme-xs dark:bg-gray-950">
        <svg
          aria-hidden="true"
          className="h-14 w-14"
          fill="none"
          viewBox="0 0 24 24"
        >
          <rect
            width="9"
            height="18"
            x="7.5"
            y="3"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M10.5 6h3M12 18h.01"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
        </svg>
      </div>

      <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
        {title}
      </h2>

      {entries.length > 0 ? (
        <dl className="mx-auto mt-5 max-w-xl divide-y divide-gray-200 text-left dark:divide-gray-800">
          {entries.map(([key, value]) => (
            <div key={key} className="grid gap-2 py-3 sm:grid-cols-[180px_1fr]">
              <dt className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                {humanizeKey(key)}
              </dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-white">
                {String(value)}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="mt-6 border-t border-gray-200 pt-5 dark:border-gray-800">
        <p className="text-lg font-bold text-gray-900 dark:text-white">
          {checkedAt}
        </p>
        <p className="mt-1 text-xs text-gray-400">Movisur</p>
      </div>
    </div>
  );
}

export default function IcloudCheckTool() {
  const [identifier, setIdentifier] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const [message, setMessage] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setResult(null);
    setIsChecking(true);

    const response = await fetch("/api/icloud-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier }),
    });
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
      result?: unknown;
    } | null;

    setIsChecking(false);

    if (!response.ok) {
      setMessage(payload?.message ?? "No se pudo consultar el equipo.");
      return;
    }

    setResult(payload?.result ?? null);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          IMEI o serial
        </span>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="Ingresa IMEI o serial"
            className="h-12 flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
          />
          <button
            type="submit"
            disabled={isChecking}
            className="h-12 rounded-lg bg-brand-500 px-6 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
          >
            {isChecking ? "Consultando..." : "Consultar"}
          </button>
        </div>
      </label>

      {message ? (
        <div className="mt-6 rounded-xl border border-error-200 bg-error-50 px-4 py-4 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10">
          {message}
        </div>
      ) : null}

      {result ? (
        <IcloudResultCard result={result} />
      ) : null}
    </form>
  );
}
