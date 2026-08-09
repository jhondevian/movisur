import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard | Movisur",
  description: "Resumen administrativo con datos reales de Movisur.",
};

type PaymentMetadata = {
  price?: string;
  currency?: string;
  purchaseStatus?: string;
  userName?: string;
  itemName?: string;
  planName?: string;
  commerceType?: "license" | "rental";
};

function parseMetadata(metadata: string | null): PaymentMetadata {
  if (!metadata) return {};

  try {
    return JSON.parse(metadata) as PaymentMetadata;
  } catch {
    return {};
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es").format(value);
}

export default async function AdminDashboardPage() {
  const [
    totalUsers,
    totalCreators,
    totalModerators,
    activeProducts,
    saleProducts,
    activeVersions,
    saleVersions,
    pendingCreatorRequests,
    activeCategories,
    productDownloads,
    versionDownloads,
    purchaseNotifications,
    latestUsers,
    latestFiles,
    latestCreatorRequests,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "creador" } }),
    prisma.user.count({ where: { role: "moderador" } }),
    prisma.movisurProductFile.count({
      where: { isActive: true, deletedAt: null },
    }),
    prisma.movisurProductFile.count({
      where: { isActive: true, deletedAt: null, isForSale: true },
    }),
    prisma.movisurVersion.count({ where: { isActive: true } }),
    prisma.movisurVersion.count({
      where: { isActive: true, isSaleVersion: true },
    }),
    prisma.creatorAccessRequest.count({ where: { status: "pending" } }),
    prisma.movisurBrandCategory.count({ where: { isActive: true } }),
    prisma.movisurProductFileDownload.aggregate({
      _sum: { downloadCount: true },
    }),
    prisma.movisurVersion.aggregate({
      _sum: { downloads: true },
    }),
    prisma.adminNotification.findMany({
      where: {
        type: "binance_payment_confirmation",
        recipientUserId: null,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        message: true,
        metadata: true,
        createdAt: true,
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.movisurProductFile.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        isActive: true,
        isForSale: true,
        downloads: true,
        createdAt: true,
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.creatorAccessRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        publicName: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    }),
  ]);

  const confirmedPurchases = purchaseNotifications.filter((notification) => {
    const metadata = parseMetadata(notification.metadata);
    return metadata.purchaseStatus === "confirmed";
  });
  const pendingPurchases = purchaseNotifications.length - confirmedPurchases.length;
  const totalSales = confirmedPurchases.reduce((total, notification) => {
    const metadata = parseMetadata(notification.metadata);
    return total + Number(metadata.price || 0);
  }, 0);
  const totalDownloads =
    (productDownloads._sum.downloadCount || 0) +
    (versionDownloads._sum.downloads || 0);

  const cards = [
    {
      label: "Usuarios",
      value: formatNumber(totalUsers),
      detail: `${formatNumber(totalCreators)} creadores, ${formatNumber(
        totalModerators
      )} moderadores`,
      href: "/admin/usuarios",
    },
    {
      label: "Archivos",
      value: formatNumber(activeProducts),
      detail: `${formatNumber(saleProducts)} productos en venta`,
      href: "/admin/archivos",
    },
    {
      label: "Versiones",
      value: formatNumber(activeVersions),
      detail: `${formatNumber(saleVersions)} version para compradores`,
      href: "/admin/movisur",
    },
    {
      label: "Compras pendientes",
      value: formatNumber(pendingPurchases),
      detail: `${formatNumber(confirmedPurchases.length)} confirmadas`,
      href: "/admin/compras",
    },
    {
      label: "Descargas",
      value: formatNumber(totalDownloads),
      detail: "Tool y productos descargados",
      href: "/admin/archivos",
    },
    {
      label: "Solicitudes",
      value: formatNumber(pendingCreatorRequests),
      detail: `${formatNumber(activeCategories)} categorias activas`,
      href: "/admin/creadores/solicitudes",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Resumen real de usuarios, productos, ventas y actividad de Movisur.
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ventas confirmadas
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            USD {totalSales.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-2xl border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-theme-md dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/30"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {card.label}
            </p>
            <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
              {card.value}
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {card.detail}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Compras recientes
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {pendingPurchases} pendientes por revisar.
            </p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {purchaseNotifications.slice(0, 5).map((notification) => {
              const metadata = parseMetadata(notification.metadata);
              const isConfirmed = metadata.purchaseStatus === "confirmed";

              return (
                <Link
                  key={notification.id}
                  href={`/admin/compras/${notification.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {metadata.userName || notification.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {metadata.itemName || metadata.planName || notification.message}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        isConfirmed
                          ? "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
                          : "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400"
                      }`}
                    >
                      {isConfirmed ? "Confirmada" : "Pendiente"}
                    </span>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                </Link>
              );
            })}
            {purchaseNotifications.length === 0 ? (
              <p className="px-5 py-8 text-sm text-gray-500 dark:text-gray-400">
                Todavia no hay compras registradas.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Archivos recientes
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Ultimos productos publicados en Movisur.
            </p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {latestFiles.map((file) => (
              <Link
                key={file.id}
                href={`/admin/archivos/${file.id}/edit`}
                className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {file.name}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {file.creator
                      ? `${file.creator.firstName} ${file.creator.lastName}`
                      : "Admin"}{" "}
                    - {formatNumber(file.downloads)} descargas
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    file.isActive
                      ? "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  }`}
                >
                  {file.isForSale ? "Venta" : "Libre"}
                </span>
              </Link>
            ))}
            {latestFiles.length === 0 ? (
              <p className="px-5 py-8 text-sm text-gray-500 dark:text-gray-400">
                Todavia no hay archivos publicados.
              </p>
            ) : null}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Usuarios nuevos
            </h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {latestUsers.map((user) => (
              <Link
                key={user.id}
                href={`/admin/usuarios/${user.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium capitalize text-brand-500 dark:bg-brand-500/10">
                    {user.role}
                  </span>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Solicitudes de creador
            </h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {latestCreatorRequests.map((request) => (
              <Link
                key={request.id}
                href="/admin/creadores/solicitudes"
                className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {request.publicName}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {request.user.email}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      request.status === "approved"
                        ? "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
                        : request.status === "rejected"
                        ? "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400"
                        : "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400"
                    }`}
                  >
                    {request.status === "approved"
                      ? "Aprobada"
                      : request.status === "rejected"
                      ? "Rechazada"
                      : "Pendiente"}
                  </span>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(request.createdAt)}
                  </p>
                </div>
              </Link>
            ))}
            {latestCreatorRequests.length === 0 ? (
              <p className="px-5 py-8 text-sm text-gray-500 dark:text-gray-400">
                Todavia no hay solicitudes de creador.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
