import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panel Creador | Movisur",
};

type PaymentMetadata = {
  confirmedAt?: string;
  durationMonths?: number;
  purchaseStatus?: string;
};

function formatSize(bytes: number | bigint) {
  if (bytes <= 0) return "0 MB";
  const mb = Number(bytes) / 1024 / 1024;
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(1)} MB`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function hasActivePlan(
  purchases: { createdAt: Date; metadata: string | null }[]
) {
  return purchases.some((purchase) => {
    let metadata: PaymentMetadata = {};

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

export default async function CreadorPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) redirect("/signin?next=/creador");

  let user;

  try {
    user = await verifyAuthToken(token);
  } catch {
    redirect("/signin?next=/creador");
  }

  const [files, trashCount, revisionCount, reviews, purchases] =
    await Promise.all([
      prisma.movisurProductFile.findMany({
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
        orderBy: [{ createdAt: "desc" }],
        take: 8,
      }),
      prisma.movisurProductFile.count({
        where: {
          createdById: user.id,
          deletedAt: {
            not: null,
          },
        },
      }),
      prisma.movisurProductFileRevision.count({
        where: {
          createdById: user.id,
          productFile: {
            deletedAt: null,
          },
        },
      }),
      prisma.movisurProductFileReview.aggregate({
        where: {
          uploaderId: user.id,
        },
        _avg: {
          rating: true,
        },
        _count: {
          rating: true,
        },
      }),
      prisma.adminNotification.findMany({
        where: {
          type: "binance_payment_confirmation",
          metadata: {
            contains: `"userId":"${user.id}"`,
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
      }),
    ]);

  const totalDownloads = files.reduce((total, file) => total + file.downloads, 0);
  const totalStorage = files.reduce(
    (total, file) => total + Number(file.fileSize || 0),
    0
  );
  const activeFiles = files.filter((file) => file.isActive).length;
  const saleFiles = files.filter((file) => file.isForSale).length;
  const activePlan = hasActivePlan(purchases);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Panel creador
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Hola {user.firstName}, aqui tienes el estado real de tus archivos y
            recursos publicados.
          </p>
        </div>

        <Link
          href="/creador/archivos/new"
          className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600"
        >
          + Subir archivo
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Archivos", value: files.length },
          { label: "Activos", value: activeFiles },
          { label: "En venta", value: saleFiles },
          { label: "Descargas", value: totalDownloads },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {stat.label}
            </p>
            <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Archivos recientes
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Ultimos productos que subiste al panel.
              </p>
            </div>
            <Link
              href="/creador/archivos"
              className="text-sm font-semibold text-brand-500 transition hover:text-brand-600"
            >
              Ver todos
            </Link>
          </div>

          <div className="mt-6 divide-y divide-gray-100 dark:divide-white/[0.06]">
            {files.length > 0 ? (
              files.slice(0, 5).map((file) => (
                <div
                  key={file.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900 dark:text-white">
                      {file.name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {file.category?.name || "Sin categoria"} -{" "}
                      {formatDate(file.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-medium">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {file.downloads} descargas
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 ${
                        file.isForSale
                          ? "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {file.isForSale ? "Venta" : "Libre"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-sm text-gray-500 dark:text-gray-400">
                Todavia no subiste archivos.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Resumen de actividad
            </h2>
            <div className="mt-5 grid gap-3">
              {[
                { label: "Versiones guardadas", value: revisionCount },
                { label: "Almacenamiento usado", value: formatSize(totalStorage) },
                {
                  label: "Calificacion promedio",
                  value:
                    reviews._count.rating > 0
                      ? `${reviews._avg.rating?.toFixed(1)} / 5`
                      : "-",
                },
                { label: "Resenas recibidas", value: reviews._count.rating },
                { label: "Archivos eliminados", value: trashCount },
                { label: "Plan activo", value: activePlan ? "Si" : "No" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-white/[0.03]"
                >
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {item.label}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Accesos rapidos
            </h2>
            <div className="mt-5 grid gap-3">
              <Link
                href="/creador/archivos/new"
                className="rounded-xl bg-brand-500 px-5 py-4 text-sm font-medium text-white transition hover:bg-brand-600"
              >
                Subir nuevo archivo
              </Link>
              <Link
                href="/creador/archivos"
                className="rounded-xl bg-gray-50 px-5 py-4 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
              >
                Administrar archivos
              </Link>
              <Link
                href="/creador/licencias"
                className="rounded-xl bg-gray-50 px-5 py-4 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
              >
                Ver licencias
              </Link>
              <Link
                href="/creador/alquiler"
                className="rounded-xl bg-gray-50 px-5 py-4 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
              >
                Ver alquiler
              </Link>
              {trashCount > 0 ? (
                <Link
                  href="/creador/archivos/basurero"
                  className="rounded-xl bg-gray-50 px-5 py-4 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  Recuperar archivos
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
