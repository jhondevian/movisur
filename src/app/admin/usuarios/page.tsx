import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Usuarios | Movisur",
  description: "Listado de usuarios registrados en Movisur.",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getRoleLabel(role: string) {
  if (role === "admin") return "Admin";
  if (role === "moderador") return "Moderador";
  if (role === "creador") return "Creador";
  return "Usuario";
}

export default async function AdminUsuariosPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
      _count: {
        select: {
          productFileDownloads: true,
          assignedLicenseAccounts: true,
          assignedRentalAccounts: true,
        },
      },
    },
  });

  const roleCounts = users.reduce(
    (total, user) => ({
      ...total,
      [user.role]: (total[user.role] || 0) + 1,
    }),
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Usuarios
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Vista general de cuentas registradas y actividad de acceso.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total", value: users.length },
          { label: "Usuarios", value: roleCounts.usuario || 0 },
          { label: "Creadores", value: roleCounts.creador || 0 },
          { label: "Admins", value: roleCounts.admin || 0 },
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
            Todos los usuarios
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <th className="px-5 py-3 font-medium">Usuario</th>
                <th className="px-5 py-3 font-medium">Contacto</th>
                <th className="px-5 py-3 font-medium">Rol</th>
                <th className="px-5 py-3 font-medium">Descargas</th>
                <th className="px-5 py-3 font-medium">Licencias</th>
                <th className="px-5 py-3 font-medium">Alquileres</th>
                <th className="px-5 py-3 font-medium">Ultimo login</th>
                <th className="px-5 py-3 font-medium">Registro</th>
                <th className="px-5 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-50 text-sm font-bold text-brand-500 dark:bg-brand-500/10">
                        {user.avatarUrl ? (
                          <Image
                            src={user.avatarUrl}
                            alt={user.firstName}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          user.firstName.slice(0, 1).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">{user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                    <p>{user.email}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {user.phone || "Sin telefono"}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-500 dark:bg-brand-500/10">
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                    {user._count.productFileDownloads}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                    {user._count.assignedLicenseAccounts}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                    {user._count.assignedRentalAccounts}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : "-"}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/usuarios/${user.id}`}
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
      </div>
    </div>
  );
}
