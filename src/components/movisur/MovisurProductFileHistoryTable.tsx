"use client";

import Badge from "@/components/ui/badge/Badge";
import { useRouter } from "next/navigation";
import { useState } from "react";

type RevisionWithCreator = {
  id: string;
  versionNumber: number;
  distribution: "url" | "file";
  downloadUrl: string;
  fileType: string;
  fileMimeType: string | null;
  fileName: string | null;
  fileSize: number | null;
  isCurrent: boolean;
  createdAt: string;
  creator: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
};

type MovisurProductFileHistoryTableProps = {
  productFileId: string;
  revisions: RevisionWithCreator[];
};

function formatSize(bytes: number | null) {
  if (!bytes) return "-";
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getFileTypeLabel(revision: RevisionWithCreator) {
  if (revision.fileType === "video") return "Video";
  if (revision.fileType === "file") return "Archivo";
  if (revision.fileType === "zip") return "ZIP";
  return revision.distribution === "file" ? "Archivo subido" : "URL externa";
}

export default function MovisurProductFileHistoryTable({
  productFileId,
  revisions,
}: MovisurProductFileHistoryTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  async function deleteRevision(revisionId: string) {
    if (deletingId) return;

    setError("");
    setDeletingId(revisionId);

    const response = await fetch(
      `/api/admin/movisur/product-files/${productFileId}/revisions/${revisionId}`,
      { method: "DELETE" }
    );

    setDeletingId("");

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      setError(payload?.message ?? "No se pudo eliminar la version.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-white/[0.05] dark:text-gray-400">
                {[
                  "Version",
                  "Tipo",
                  "Archivo",
                  "Tamano",
                  "Estado",
                  "Subido por",
                  "Fecha",
                  "Acciones",
                ].map((header) => (
                  <th key={header} className="px-5 py-4 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {revisions.map((revision) => (
                <tr key={revision.id}>
                  <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white">
                    v{revision.versionNumber}
                  </td>
                  <td className="px-5 py-4 text-sm text-brand-500">
                    {getFileTypeLabel(revision)}
                  </td>
                  <td className="px-5 py-4">
                    <p className="max-w-[240px] truncate text-sm font-medium text-gray-900 dark:text-white">
                      {revision.fileName || revision.downloadUrl}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {revision.fileMimeType || "URL"}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {formatSize(revision.fileSize)}
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      size="sm"
                      color={revision.isCurrent ? "success" : "light"}
                    >
                      {revision.isCurrent ? "Actual" : "Historial"}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {revision.creator
                        ? `${revision.creator.firstName} ${revision.creator.lastName}`.trim()
                        : "Sin propietario"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {revision.creator?.email || "Archivo anterior"}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(new Date(revision.createdAt))}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => deleteRevision(revision.id)}
                      disabled={deletingId === revision.id}
                      className="inline-flex items-center justify-center rounded-lg border border-error-200 bg-white px-3 py-2 text-xs font-medium text-error-600 transition hover:bg-error-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-error-500/30 dark:bg-gray-900 dark:hover:bg-error-500/10"
                    >
                      {deletingId === revision.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
