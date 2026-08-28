import MovisurProductFilesTable from "@/components/movisur/MovisurProductFilesTable";
import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Archivos | Movisur",
  description: "Gestiona archivos y productos descargables de Movisur",
};

type AdminArchivosPageProps = {
  searchParams: Promise<{ filtro?: string }>;
};

const filterLinks = [
  { label: "Todos", value: "todos" },
  { label: "De creadores", value: "creadores" },
  { label: "Mis archivos", value: "mios" },
];

export default async function AdminArchivosPage({
  searchParams,
}: AdminArchivosPageProps) {
  const { filtro = "todos" } = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;
  const authUser = token ? await verifyAuthToken(token).catch(() => null) : null;
  const where =
    filtro === "creadores"
      ? { creator: { role: "creador" as const }, deletedAt: null }
      : filtro === "mios" && authUser
      ? { createdById: authUser.id, deletedAt: null }
      : { deletedAt: null };
  const files = await prisma.movisurProductFile.findMany({
    where,
    include: {
      category: {
        select: {
          name: true,
        },
      },
      creator: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Archivos
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Sube productos descargables aparte de la version principal de
            Movisur Tool.
          </p>
        </div>

        <Link
          href="/admin/archivos/new"
          className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600"
        >
          + Subir archivo
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {filterLinks.map((filter) => {
          const isActive = filtro === filter.value;

          return (
            <Link
              key={filter.value}
              href={
                filter.value === "todos"
                  ? "/admin/archivos"
                  : `/admin/archivos?filtro=${filter.value}`
              }
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-brand-500 text-white"
                  : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.03]"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Archivos", value: files.length },
          { label: "Activos", value: files.filter((file) => file.isActive).length },
          { label: "En venta", value: files.filter((file) => file.isForSale).length },
        ].map((stat) => (
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

      <MovisurProductFilesTable
        files={files.map((file) => ({
          ...file,
          fileSize: file.fileSize === null ? null : Number(file.fileSize),
        }))}
        editBasePath="/admin/archivos"
        showOwner
      />
    </div>
  );
}
