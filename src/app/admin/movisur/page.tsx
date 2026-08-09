import MovisurVersionsTable from "@/components/movisur/MovisurVersionsTable";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Control de versiones | Movisur",
  description: "Gestiona las versiones descargables de Movisur Tool",
};

export default async function MovisurVersionsPage() {
  const versions = await prisma.movisurVersion.findMany({
    orderBy: [{ createdAt: "desc" }],
  });

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Control de versiones
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Gestiona las versiones de la app y fuerza actualizaciones.
          </p>
        </div>

        <Link
          href="/admin/movisur/new"
          className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600"
        >
          + Nueva version
        </Link>
      </div>

      <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        {versions.length} versiones registradas
      </p>

      <MovisurVersionsTable versions={versions} />
    </div>
  );
}
