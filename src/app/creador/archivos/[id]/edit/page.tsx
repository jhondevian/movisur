import MovisurProductFileHistoryTable from "@/components/movisur/MovisurProductFileHistoryTable";
import MovisurProductFileForm from "@/components/movisur/MovisurProductFileForm";
import ProductFileTrashButton from "@/components/movisur/ProductFileTrashButton";
import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Editar archivo creador | Movisur",
  description: "Edita un producto descargable desde el panel creador",
};

export default async function EditCreadorArchivoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) redirect("/signin?next=/creador/archivos");

  let user;

  try {
    user = await verifyAuthToken(token);
  } catch {
    redirect("/signin?next=/creador/archivos");
  }

  const [file, categories] = await Promise.all([
    prisma.movisurProductFile.findFirst({
      where: {
        id,
        createdById: user.id,
        deletedAt: null,
      },
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
            Actualiza el producto, su imagen, descarga, estado activo o venta.
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
        initialFile={file}
        returnPath="/creador/archivos"
      />

      <div className="mt-8">
        <ProductFileTrashButton
          productFileId={file.id}
          returnPath="/creador/archivos"
        />
      </div>

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
          }))}
        />
      </div>
    </div>
  );
}
