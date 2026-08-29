"use client";

import { useState } from "react";

const reportReasons = [
  "No descarga",
  "Enlace caido",
  "Archivo incorrecto",
  "Version danada",
  "Otro",
];

type ProductFileReportButtonProps = {
  productFileId: string;
};

export default function ProductFileReportButton({
  productFileId,
}: ProductFileReportButtonProps) {
  const [reason, setReason] = useState(reportReasons[0]);
  const [details, setDetails] = useState("");
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
        body: JSON.stringify({ reason, details }),
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

    setDetails("");
    setMessage("Reporte enviado. El admin lo revisara.");
  }

  return (
    <div className="mt-7 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-sm font-bold text-gray-950 dark:text-white">
        Reportar archivo caido
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <select
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 outline-none transition focus:border-brand-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
        >
          {reportReasons.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={submitReport}
          disabled={isSending}
          className="h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-white/5"
        >
          {isSending ? "Enviando..." : "Reportar"}
        </button>
      </div>
      <textarea
        value={details}
        onChange={(event) => setDetails(event.target.value)}
        placeholder="Detalle opcional"
        rows={3}
        className="mt-3 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
      />
      {message ? (
        <p className="mt-3 text-sm font-semibold text-brand-500">{message}</p>
      ) : null}
    </div>
  );
}
