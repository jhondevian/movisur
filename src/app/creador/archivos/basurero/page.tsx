import ProductFileRestoreButton from "@/components/movisur/ProductFileRestoreButton";
import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Basurero creador | Movisur",
  description: "Recupera archivos enviados al basurero desde el panel creador",
};

function formatSize(bytes: number | null) {
  if (!bytes) return "Remoto";
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(date: Date | null) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

async function hasConfirmedPurchase(userId: string) {
  const purchases = await prisma.adminNotification.findMany({
    where: {
      type: "binance_payment_confirmation",
      metadata: {
        contains: `"userId":"${userId}"`,
      },
      AND: [
        {
          metadata: {
            contains: `"purchaseStatus":"confirmed"`,
          },
        },
      ],
    },
    select: {
      createdAt: true,
      metadata: true,
    },
  });

  return purchases.some((purchase) => {
    let metadata: {
      confirmedAt?: string;
      durationMonths?: number;
      purchaseStatus?: string;
    } = {};

    try {
      metadata = JSON.parse(purchase.metadata || "{}");
    } catch {
      return false;
    }

    if (metadata.purchaseStatus !== "confirmed") return false;

    const months = Number(metadata.durationMonths || 0);
    if (months <= 0) return true;

    const start = metadata.confirmedAt
      ? new Date(metadata.confirmedAt)
      : purchase.createdAt;
    const expiresAt = new Date(start);
    expiresAt.setMonth(expiresAt.getMonth() + months);

    return expiresAt.getTime() >= Date.now();
  });
}

export default async function CreadorArchivosBasureroPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) redirect("/signin?next=/creador/archivos/basurero");

  let user;

  try {
    user = await verifyAuthToken(token);
  } catch {
    redirect("/signin?next=/creador/archivos/basurero");
  }

  const [files, canRestore] = await Promise.all([
    prisma.movisurProductFile.findMany({
      where: {
        createdById: user.id,
        deletedAt: {
          not: null,
        },
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
        revisions: {
          select: {
            id: true,
          },
        },
      },
      orderBy: [{ deletedAt: "desc" }, { createdAt: "desc" }],
    }),
    hasConfirmedPurchase(user.id),
  ]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Basurero
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Archivos ocultos de tu panel. Su historial queda guardado para poder
            recuperarlos.
          </p>
        </div>

        <Link
          href="/creador/archivos"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
        >
          Volver a archivos
        </Link>
      </div>

      {!canRestore ? (
        <div className="mb-6 rounded-2xl border border-warning-200 bg-warning-50 p-5 dark:border-warning-500/20 dark:bg-warning-500/10">
          <p className="text-sm font-semibold text-warning-800 dark:text-warning-300">
            Para recuperar archivos del basurero necesitas un plan activo.
          </p>
          <Link
            href="/informacion?comprar=1"
            className="mt-3 inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Comprar plan
          </Link>
        </div>
      ) : null}

      {files.length > 0 ? (
        <div className="grid gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex flex-col gap-5 border-b border-gray-200 pb-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-900">
                  {file.imageUrl ? (
                    <Image
                      src={file.imageUrl}
                      alt={file.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-lg font-bold text-brand-500">
                      {file.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-gray-900 dark:text-white">
                    {file.name}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {file.category?.name || "Sin categoria"} -{" "}
                    {formatSize(file.fileSize)} - {file.revisions.length}{" "}
                    versiones
                  </p>
                  <p className="mt-1 text-xs font-medium text-gray-400 dark:text-gray-500">
                    Enviado el {formatDate(file.deletedAt)}
                  </p>
                </div>
              </div>

              {canRestore ? (
                <ProductFileRestoreButton productFileId={file.id} />
              ) : (
                <Link
                  href="/informacion?comprar=1"
                  className="inline-flex items-center justify-center rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Requiere plan
                </Link>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            No tienes archivos en el basurero
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Cuando envies un archivo al basurero aparecera aqui.
          </p>
        </div>
      )}
    </div>
  );
}
