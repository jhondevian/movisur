import MovisurProductFilesTable from "@/components/movisur/MovisurProductFilesTable";
import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Archivos creador | Movisur",
  description: "Gestiona productos y archivos desde el panel creador",
};

export default async function CreadorArchivosPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) redirect("/signin?next=/creador/archivos");

  let user;

  try {
    user = await verifyAuthToken(token);
  } catch {
    redirect("/signin?next=/creador/archivos");
  }

  const files = await prisma.movisurProductFile.findMany({
    where: {
      createdById: user.id,
      deletedAt: null,
    },
    include: {
      category: {
        select: {
          name: true,
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
            Sube productos descargables y organiza recursos para Movisur.
          </p>
        </div>

        <Link
          href="/creador/archivos/new"
          className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600"
        >
          + Subir archivo
        </Link>
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
        editBasePath="/creador/archivos"
      />
    </div>
  );
}
