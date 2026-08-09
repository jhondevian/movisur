import MovisurProductFileHistoryTable from "@/components/movisur/MovisurProductFileHistoryTable";
import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Historial creador | Movisur",
  description: "Revisa versiones anteriores de tus productos",
};

export default async function CreadorArchivoHistorialPage({
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

  const productFile = await prisma.movisurProductFile.findFirst({
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
          href="/creador/archivos"
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
        }))}
      />
    </div>
  );
}
