import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Creadores | Movisur",
  description: "Administra creadores registrados en Movisur.",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function AdminCreadoresPage() {
  const creators = await prisma.user.findMany({
    where: { role: "creador" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      avatarUrl: true,
      createdAt: true,
      _count: {
        select: {
          productFiles: true,
          creatorLicenseOffers: true,
          creatorRentalOffers: true,
          receivedNotifications: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Creadores
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Administra usuarios con acceso para publicar archivos, licencias y
          alquileres.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Creadores", value: creators.length },
          {
            label: "Archivos",
            value: creators.reduce(
              (total, creator) => total + creator._count.productFiles,
              0
            ),
          },
          {
            label: "Licencias activas",
            value: creators.reduce(
              (total, creator) => total + creator._count.creatorLicenseOffers,
              0
            ),
          },
          {
            label: "Alquileres activos",
            value: creators.reduce(
              (total, creator) => total + creator._count.creatorRentalOffers,
              0
            ),
          },
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

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Creadores registrados
          </h2>
        </div>

        {creators.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <th className="px-5 py-3 font-medium">Creador</th>
                  <th className="px-5 py-3 font-medium">Contacto</th>
                  <th className="px-5 py-3 font-medium">Archivos</th>
                  <th className="px-5 py-3 font-medium">Licencias</th>
                  <th className="px-5 py-3 font-medium">Alquileres</th>
                  <th className="px-5 py-3 font-medium">Ordenes</th>
                  <th className="px-5 py-3 font-medium">Registro</th>
                  <th className="px-5 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {creators.map((creator) => (
                  <tr key={creator.id}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-50 text-sm font-bold text-brand-500 dark:bg-brand-500/10">
                          {creator.avatarUrl ? (
                            <Image
                              src={creator.avatarUrl}
                              alt={creator.firstName}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            creator.firstName.slice(0, 1).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {creator.firstName} {creator.lastName}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {creator.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <p>{creator.email}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {creator.phone || "Sin telefono"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                      {creator._count.productFiles}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                      {creator._count.creatorLicenseOffers}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                      {creator._count.creatorRentalOffers}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                      {creator._count.receivedNotifications}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(creator.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/creadores/${creator.id}`}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
                      >
                        Detalles
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            Todavia no hay creadores aprobados.
          </div>
        )}
      </div>
    </div>
  );
}
