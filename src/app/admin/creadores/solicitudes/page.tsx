import AdminCreatorRequestActions from "@/components/movisur/AdminCreatorRequestActions";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Solicitudes | Movisur",
  description: "Solicitudes de usuarios para acceder como creadores.",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusLabel(status: string) {
  if (status === "approved") return "Aprobada";
  if (status === "rejected") return "Rechazada";
  return "Pendiente";
}

export default async function AdminSolicitudesPage() {
  const requests = await prisma.creatorAccessRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
      reviewedBy: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  const pendingCount = requests.filter(
    (request) => request.status === "pending"
  ).length;
  const approvedCount = requests.filter(
    (request) => request.status === "approved"
  ).length;
  const rejectedCount = requests.filter(
    (request) => request.status === "rejected"
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Solicitudes
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Usuarios que quieren acceder al panel creador de Movisur.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Pendientes", value: pendingCount },
          { label: "Aprobadas", value: approvedCount },
          { label: "Rechazadas", value: rejectedCount },
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
            Solicitudes recibidas
          </h2>
        </div>

        {requests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1160px] text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <th className="px-5 py-3 font-medium">Creador</th>
                  <th className="px-5 py-3 font-medium">Correo</th>
                  <th className="px-5 py-3 font-medium">Pais</th>
                  <th className="px-5 py-3 font-medium">Especialidad</th>
                  <th className="px-5 py-3 font-medium">Mensaje</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Revisado por</th>
                  <th className="px-5 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-900">
                          {request.imageUrl ? (
                            <Image
                              src={request.imageUrl}
                              alt={request.publicName}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <span className="text-sm font-bold text-brand-500">
                              {request.publicName.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {request.publicName}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {request.user.firstName} {request.user.lastName} -
                            rol {request.user.role}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <div>
                        <p>{request.user.email}</p>
                        {request.whatsapp ? (
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            WhatsApp: {request.whatsapp}
                          </p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {request.country}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {request.specialty || "-"}
                    </td>
                    <td className="max-w-[320px] px-5 py-4 text-sm leading-6 text-gray-600 dark:text-gray-400">
                      {request.message || "Sin mensaje"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          request.status === "approved"
                            ? "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
                            : request.status === "rejected"
                            ? "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400"
                            : "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400"
                        }`}
                      >
                        {getStatusLabel(request.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {request.reviewedBy
                        ? `${request.reviewedBy.firstName} ${request.reviewedBy.lastName}`
                        : "-"}
                    </td>
                    <td className="px-5 py-4">
                      <AdminCreatorRequestActions
                        id={request.id}
                        status={request.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Todavia no hay solicitudes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
