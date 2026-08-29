"use client";

import { useState } from "react";

type ProductFileReportButtonProps = {
  productFileId: string;
};

export default function ProductFileReportButton({
  productFileId,
}: ProductFileReportButtonProps) {
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");

  async function submitReport() {
    if (isSending) return;

    setIsSending(true);
    setMessage("");

    const response = await fetch(
      `/api/movisur/product-files/${productFileId}/report`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "No descarga" }),
      }
    );

    setIsSending(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      setMessage(payload?.message ?? "No se pudo enviar el reporte.");
      return;
    }

    setMessage("Reporte enviado. El admin lo revisara.");
  }

  return (
    <div className="min-w-0 text-center">
      <button
        type="button"
        onClick={submitReport}
        disabled={isSending}
        className="flex min-h-14 w-full min-w-0 items-center justify-center rounded-2xl bg-white px-3 py-3 text-center text-xs font-bold leading-tight text-gray-950 shadow-theme-lg ring-1 ring-gray-100 transition hover:text-error-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-900 dark:text-white dark:ring-gray-800 sm:min-h-16 sm:text-sm"
      >
        {isSending ? "Enviando" : "Reportar"}
      </button>
      <span className="mt-2 block text-sm font-semibold text-gray-600 dark:text-gray-300">
        Archivo caido
      </span>
      {message ? (
        <p className="mt-2 text-xs font-semibold text-brand-500">{message}</p>
      ) : null}
    </div>
  );
}
