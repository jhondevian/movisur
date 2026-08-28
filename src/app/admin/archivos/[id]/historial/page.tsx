import MovisurProductFileHistoryTable from "@/components/movisur/MovisurProductFileHistoryTable";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Historial de archivo | Movisur",
  description: "Revisa y elimina versiones anteriores de un producto",
};

export default async function AdminArchivoHistorialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productFile = await prisma.movisurProductFile.findUnique({
    where: { id },
    include: {
      revisions: {
        orderBy: { versionNumber: "desc" },
        include: {
          creator: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!productFile) notFound();

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Historial de versiones
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {productFile.name}. Si eliminas la actual, la anterior queda
            disponible automaticamente.
          </p>
        </div>

        <Link
          href="/admin/archivos"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
        >
          Volver al listado
        </Link>
      </div>

      <MovisurProductFileHistoryTable
        productFileId={productFile.id}
        revisions={productFile.revisions.map((revision) => ({
          ...revision,
          createdAt: revision.createdAt.toISOString(),
          fileSize:
            revision.fileSize === null ? null : Number(revision.fileSize),
        }))}
      />
    </div>
  );
}
