import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import TelegramFilesTable from "@/components/telegram/TelegramFilesTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Telegram | Movisur",
  description: "Importa y gestiona archivos encontrados en Telegram",
};

export default async function AdminTelegramPage() {
  const files = await prisma.telegramFile.findMany({
    orderBy: { receivedAt: "desc" },
    take: 100,
  });
  const pendingCount = files.filter((file) => file.status === "pending").length;
  const importedCount = files.filter(
    (file) => file.status === "imported"
  ).length;
  const stats = [
    { label: "Archivos detectados", value: files.length },
    { label: "Pendientes", value: pendingCount },
    { label: "Importados", value: importedCount },
  ];

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Telegram
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
            Revisa archivos encontrados en tus canales o grupos de Telegram y
            preparalos para importarlos como archivos de Movisur.
          </p>
        </div>

        <Link
          href="/admin/telegram/configurar"
          className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600"
        >
          Configurar Telegram
        </Link>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {stat.label}
            </p>
            <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <TelegramFilesTable
        files={files.map((file) => ({
          caption: file.caption,
          chatId: file.chatId,
          chatTitle: file.chatTitle,
          fileKind: file.fileKind,
          fileMimeType: file.fileMimeType,
          fileName: file.fileName,
          fileSize: file.fileSize,
          id: file.id,
          importedFileId: file.importedFileId,
          receivedAt: file.receivedAt.toISOString(),
          status: file.status,
        }))}
      />
    </div>
  );
}
