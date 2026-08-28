import MovisurProductFileHistoryTable from "@/components/movisur/MovisurProductFileHistoryTable";
import MovisurProductFileForm from "@/components/movisur/MovisurProductFileForm";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Editar archivo | Movisur",
  description: "Edita un archivo descargable de Movisur",
};

export default async function EditAdminArchivoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [file, categories, owners] = await Promise.all([
    prisma.movisurProductFile.findUnique({
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
    }),
    prisma.movisurBrandCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        models: {
          where: { isActive: true },
          orderBy: [{ sortOrder: "asc" }, { year: "desc" }, { name: "asc" }],
          select: {
            id: true,
            categoryId: true,
            name: true,
            code: true,
            year: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { firstName: "asc" }, { lastName: "asc" }],
      select: {
        email: true,
        firstName: true,
        id: true,
        lastName: true,
        role: true,
      },
    }),
  ]);

  if (!file) notFound();

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Editar archivo
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Actualiza el producto, su descarga, estado activo o venta.
          </p>
        </div>

        <Link
          href="/admin/archivos"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
        >
          Volver al listado
        </Link>
      </div>

      <MovisurProductFileForm
        categories={categories}
        initialFile={{
          id: file.id,
          name: file.name,
          categoryId: file.categoryId,
          deviceModelId: file.deviceModelId,
          description: file.description,
          imageUrl: file.imageUrl,
          distribution: file.distribution,
          downloadUrl: file.downloadUrl,
          fileType: file.fileType,
          isActive: file.isActive,
          isForSale: file.isForSale,
          sortOrder: file.sortOrder,
          createdById: file.createdById,
          firmwareYear: file.firmwareYear,
          firmwareRegion: file.firmwareRegion,
          firmwareBuild: file.firmwareBuild,
          androidVersion: file.androidVersion,
          binaryVersion: file.binaryVersion,
        }}
        owners={owners}
      />

      <div className="mt-8">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Historial
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Si eliminas la version actual, la anterior queda disponible
            automaticamente.
          </p>
        </div>
        <MovisurProductFileHistoryTable
          productFileId={file.id}
          revisions={file.revisions.map((revision) => ({
            ...revision,
            createdAt: revision.createdAt.toISOString(),
            fileSize:
              revision.fileSize === null ? null : Number(revision.fileSize),
          }))}
        />
      </div>
    </div>
  );
}
