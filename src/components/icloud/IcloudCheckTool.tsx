"use client";

import { FormEvent, useState } from "react";

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
        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            Resultado
          </p>
          <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg bg-white p-4 text-sm leading-6 text-gray-700 dark:bg-gray-950 dark:text-gray-300">
            {typeof result === "string"
              ? result
              : JSON.stringify(result, null, 2)}
          </pre>
        </div>
      ) : null}
    </form>
  );
}
