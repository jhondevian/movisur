import MovisurProductFileForm from "@/components/movisur/MovisurProductFileForm";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Subir archivo creador | Movisur",
  description: "Sube un producto descargable desde el panel creador",
};

export default async function NewCreadorArchivoPage() {
  const categories = await prisma.movisurBrandCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
    },
  });

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Subir archivo
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Crea un producto descargable independiente para Movisur.
          </p>
        </div>

        <Link
          href="/creador/archivos"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
        >
          Volver al listado
        </Link>
      </div>

      <MovisurProductFileForm
        categories={categories}
        returnPath="/creador/archivos"
      />
    </div>
  );
}
