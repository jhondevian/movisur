import NewMovisurVersionForm from "@/components/movisur/NewMovisurVersionForm";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Editar version | Movisur",
  description: "Editar una version descargable de Movisur Tool",
};

export default async function EditMovisurVersionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const version = await prisma.movisurVersion.findUnique({
    where: { id },
  });

  if (!version) notFound();

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Editar version
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Actualiza los datos de v{version.version} y define si sera la
            version para venta.
          </p>
        </div>

        <Link
          href="/admin/movisur"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
        >
          Volver al listado
        </Link>
      </div>

      <NewMovisurVersionForm initialVersion={version} />
    </div>
  );
}
