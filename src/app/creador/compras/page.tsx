import AdminPurchaseActions from "@/components/movisur/AdminPurchaseActions";
import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compras creador | Movisur",
  description: "Ordenes recibidas por licencias, alquileres y productos",
};

type PaymentMetadata = {
  method?: string;
  commerceType?: "license" | "rental";
  itemName?: string;
  assignedAccountStatus?: string;
  userEmail?: string;
  userName?: string;
  planName?: string;
  durationMonths?: number;
  price?: string;
  currency?: string;
  purchaseStatus?: string;
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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function CreadorComprasPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) redirect("/signin?next=/creador/compras");

  let user;

  try {
    user = await verifyAuthToken(token);
  } catch {
    redirect("/signin?next=/creador/compras");
  }

  const confirmations = await prisma.adminNotification.findMany({
    where: {
      type: "binance_payment_confirmation",
      recipientUserId: user.id,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const confirmedCount = confirmations.filter((item) => {
    const metadata = parseMetadata(item.metadata);
    return metadata.purchaseStatus === "confirmed";
  }).length;
  const pendingCount = confirmations.length - confirmedCount;
  const totalAmount = confirmations.reduce((total, item) => {
    const metadata = parseMetadata(item.metadata);
    return total + Number(metadata.price || 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Compras
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Ordenes recibidas por tus licencias, alquileres y productos.
          </p>
        </div>
        <Link
          href="/creador/compras/configuracion"
          className="rounded-lg bg-brand-500 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-brand-600"
        >
          Configuracion
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Ordenes", value: confirmations.length },
          { label: "Pendientes", value: pendingCount },
          { label: "Confirmadas", value: confirmedCount },
          { label: "Monto", value: `USD ${totalAmount.toFixed(2)}` },
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

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {confirmations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <th className="px-5 py-3 font-medium">Usuario</th>
                  <th className="px-5 py-3 font-medium">Producto</th>
                  <th className="px-5 py-3 font-medium">Duracion</th>
                  <th className="px-5 py-3 font-medium">Metodo</th>
                  <th className="px-5 py-3 font-medium">Precio</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {confirmations.map((confirmation) => {
                  const metadata = parseMetadata(confirmation.metadata);
                  const isConfirmed =
                    metadata.purchaseStatus === "confirmed";
                  const durationLabel =
                    metadata.commerceType === "rental" ? "hora" : "mes";
                  const duration = metadata.durationMonths
                    ? `${metadata.durationMonths} ${durationLabel}${
                        metadata.durationMonths === 1 ? "" : "s"
                      }`
                    : "-";

                  return (
                    <tr key={confirmation.id}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {metadata.userName || "Usuario"}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {metadata.userEmail || "-"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {metadata.itemName || confirmation.message}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {metadata.planName || "-"}
                          {metadata.assignedAccountStatus ===
                          "sin_cuentas_disponibles"
                            ? " - sin cuentas libres"
                            : ""}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {duration}
                      </td>
                      <td className="px-5 py-4 text-sm capitalize text-gray-700 dark:text-gray-300">
                        {metadata.method || "binance"}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                        {metadata.currency || "USD"} {metadata.price || "-"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            isConfirmed
                              ? "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
                              : "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400"
                          }`}
                        >
                          {isConfirmed ? "Confirmada" : "Pendiente"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(confirmation.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <AdminPurchaseActions
                          id={confirmation.id}
                          isConfirmed={isConfirmed}
                          detailHref={`/creador/compras/${confirmation.id}`}
                          confirmEndpoint={`/api/creador/compras/${confirmation.id}/confirm`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Todavia no tienes ordenes.
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Cuando un usuario confirme un pago de tus productos, aparecera
              aqui.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
