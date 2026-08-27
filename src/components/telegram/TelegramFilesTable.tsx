"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type TelegramFileRow = {
  caption: string | null;
  chatId: string;
  chatTitle: string | null;
  fileKind: string;
  fileMimeType: string | null;
  fileName: string | null;
  fileSize: number | null;
  id: string;
  importedFileId: string | null;
  receivedAt: string;
  status: string;
};

type TelegramFilesTableProps = {
  files: TelegramFileRow[];
};

const tableHeaders = [
  "Archivo",
  "Origen",
  "Tamano",
  "Fecha",
  "Estado",
  "Acciones",
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatSize(bytes: number | null) {
  if (!bytes) return "-";
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function TelegramFilesTable({ files }: TelegramFilesTableProps) {
  const router = useRouter();
  const [importingId, setImportingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function importFile(id: string) {
    setMessage("");
    setImportingId(id);

    const response = await fetch(`/api/admin/telegram/files/${id}/import`, {
      method: "POST",
    });

    setImportingId(null);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      setMessage(payload?.message ?? "No se pudo importar el archivo.");
      return;
    }

    setMessage("Archivo importado a Movisur.");
    router.refresh();
  }

  return (
    <div className="overflow-hidden">
      {message ? (
        <div className="mb-4 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:bg-white/[0.03] dark:text-gray-300">
          {message}
        </div>
      ) : null}
      <div className="max-w-full overflow-hidden">
        <table className="w-full table-fixed text-left">
          <thead>
            <tr className="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-white/[0.05] dark:text-gray-400">
              {tableHeaders.map((header) => (
                <th key={header} className="px-3 py-4 font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {files.map((file) => (
              <tr key={file.id}>
                <td className="px-3 py-4">
                  <p className="truncate font-semibold text-gray-900 dark:text-white">
                    {file.fileName || `${file.fileKind} de Telegram`}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
                    {file.caption || file.fileMimeType || "Sin descripcion"}
                  </p>
                </td>
                <td className="px-3 py-4 text-sm text-gray-700 dark:text-gray-300">
                  <p className="truncate">{file.chatTitle || file.chatId}</p>
                  <p className="mt-1 text-xs text-gray-500">{file.chatId}</p>
                </td>
                <td className="px-3 py-4 text-sm text-gray-700 dark:text-gray-300">
                  {formatSize(file.fileSize)}
                </td>
                <td className="px-3 py-4 text-sm text-gray-700 dark:text-gray-300">
                  {formatDate(file.receivedAt)}
                </td>
                <td className="px-3 py-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {file.status}
                </td>
                <td className="px-3 py-4 text-right">
                  <button
                    type="button"
                    disabled={
                      Boolean(file.importedFileId) || importingId === file.id
                    }
                    onClick={() => importFile(file.id)}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.03]"
                  >
                    {file.importedFileId
                      ? "Importado"
                      : importingId === file.id
                      ? "Importando..."
                      : "Importar"}
                  </button>
                </td>
              </tr>
            ))}
            {files.length === 0 ? (
              <tr>
                <td colSpan={tableHeaders.length} className="px-3 py-16">
                  <div className="mx-auto max-w-xl text-center">
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      Aun no hay archivos de Telegram
                    </p>
                    <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                      Configura el bot, agregalo a tu canal o grupo, y los
                      documentos, ZIPs o videos recibidos apareceran aqui.
                    </p>
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
