"use client";

import { FormEvent, useState } from "react";

type IcloudResultObject = Record<string, unknown>;
type ResultLine = {
  label: string;
  value: string;
};

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

function stripHtml(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\r/g, "")
    .trim();
}

function normalizeLinesFromText(value: string) {
  const text = stripHtml(value);

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf(":");

      if (separatorIndex === -1) {
        return { label: "Info", value: line };
      }

      return {
        label: line.slice(0, separatorIndex).trim(),
        value: line.slice(separatorIndex + 1).trim(),
      };
    })
    .filter((line) => line.value);
}

function normalizeResult(result: unknown) {
  const baseResult =
    isResultObject(result) && "response" in result ? result.response : result;

  if (typeof baseResult === "string") {
    const lines = normalizeLinesFromText(baseResult);
    const model =
      lines.find((line) => /^(model|model name|marketing name)$/i.test(line.label))
        ?.value || "";

    return {
      error: "",
      lines,
      rawText: stripHtml(baseResult),
      title: model || "Resultado iCloud Check",
    };
  }

  if (!isResultObject(baseResult)) {
    return {
      error: "",
      lines: [],
      rawText: "",
      title: "Resultado iCloud Check",
    };
  }

  const error = getStringValue(baseResult, ["error", "message"]);
  const success = baseResult.success;

  if (success === false || error) {
    return {
      error: error || "El proveedor rechazo la consulta.",
      lines: [],
      rawText: "",
      title: "Consulta rechazada",
    };
  }

  const nestedResponse =
    typeof baseResult.response === "string"
      ? normalizeLinesFromText(baseResult.response)
      : [];
  const objectLines = getResultEntries(baseResult).map(([key, value]) => ({
    label: humanizeKey(key),
    value: String(value),
  }));
  const lines = nestedResponse.length > 0 ? nestedResponse : objectLines;
  const title =
    getStringValue(baseResult, [
      "title",
      "model",
      "modelName",
      "device",
      "deviceName",
    ]) ||
    lines.find((line) => /^(model|model name|marketing name)$/i.test(line.label))
      ?.value ||
    "Resultado iCloud Check";

  return {
    error: "",
    lines,
    rawText: lines.map((line) => `${line.label}: ${line.value}`).join("\n"),
    title,
  };
}

function humanizeKey(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function CopyIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 15V3" />
      <path d="m7 8 5-5 5 5" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  );
}

function IcloudResultCard({ result }: { result: unknown }) {
  const checkedAt = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());
  const [copyMessage, setCopyMessage] = useState("");
  const normalized = normalizeResult(result);
  const shareText = [
    normalized.title,
    "",
    normalized.lines.map((line) => `${line.label}: ${line.value}`).join("\n"),
    "",
    checkedAt,
    "Movisur",
  ]
    .filter(Boolean)
    .join("\n");

  async function copyResult() {
    await navigator.clipboard.writeText(shareText);
    setCopyMessage("Copiado");
    window.setTimeout(() => setCopyMessage(""), 1800);
  }

  async function shareResult() {
    try {
      if (navigator.share) {
        await navigator.share({
          text: shareText,
          title: normalized.title,
        });
        return;
      }
    } catch {
      return;
    }

    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  if (normalized.error) {
    return (
      <div className="mt-6 rounded-xl border border-error-200 bg-error-50 px-4 py-4 text-sm leading-6 text-error-600 dark:border-error-500/30 dark:bg-error-500/10">
        <p className="font-semibold">Consulta rechazada</p>
        <p className="mt-1">{normalized.error}</p>
      </div>
    );
  }

  return (
    <section className="mt-8 border-t border-gray-200 pt-6 text-center dark:border-gray-800">
      <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
        {normalized.title}
      </h2>

      {normalized.lines.length > 0 ? (
        <dl className="mx-auto mt-5 max-w-xl divide-y divide-gray-200 text-left dark:divide-gray-800">
          {normalized.lines.map((line, index) => (
            <div
              key={`${line.label}-${index}`}
              className="grid gap-2 py-3 sm:grid-cols-[180px_1fr]"
            >
              <dt className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                {line.label}
              </dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-white">
                {line.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={copyResult}
          aria-label="Copiar listado"
          title="Copiar listado"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
        >
          <CopyIcon />
        </button>
        <button
          type="button"
          onClick={shareResult}
          aria-label="Compartir listado"
          title="Compartir listado"
          className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-500 text-white transition hover:bg-brand-600"
        >
          <ShareIcon />
        </button>
      </div>
      {copyMessage ? (
        <p className="mt-2 text-xs font-medium text-brand-500">
          {copyMessage}
        </p>
      ) : null}

      <div className="mt-6 border-t border-gray-200 pt-5 dark:border-gray-800">
        <p className="text-lg font-bold text-gray-900 dark:text-white">
          {checkedAt}
        </p>
        <p className="mt-1 text-xs text-gray-400">Movisur</p>
      </div>
    </section>
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
