import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type PaymentMetadata = {
  method?: string;
  commerceType?: "license" | "rental";
  itemName?: string;
  planId?: string;
  planName?: string;
  durationMonths?: number;
  price?: string;
  currency?: string;
  purchaseStatus?: string;
};

type UsuarioComprasPageProps = {
  searchParams?: Promise<{
    confirmacion?: string;
  }>;
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

export default async function UsuarioComprasPage({
  searchParams,
}: UsuarioComprasPageProps) {
  const params = await searchParams;
  const showPendingNotice = params?.confirmacion === "pendiente";
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) redirect("/signin?next=/usuario/compras");

  let user;

  try {
    user = await verifyAuthToken(token);
  } catch {
    redirect("/signin?next=/usuario/compras");
  }

  const confirmations = await prisma.adminNotification.findMany({
    where: {
      type: "binance_payment_confirmation",
      metadata: {
        contains: `"userId":"${user.id}"`,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 30,
  });

  const confirmedCount = confirmations.filter((item) => {
    const metadata = parseMetadata(item.metadata);
    return metadata.purchaseStatus === "confirmed";
  }).length;
  const pendingCount = confirmations.filter((item) => {
    const metadata = parseMetadata(item.metadata);
    return (
      metadata.purchaseStatus !== "confirmed" &&
      metadata.purchaseStatus !== "rejected"
    );
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Mis compras
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Revisa las confirmaciones de pago que enviaste para tus planes
          Movisur.
        </p>
      </div>

      {showPendingNotice ? (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 px-5 py-4 text-sm text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-200">
          <p className="font-semibold">
            Ya tienes una confirmacion en proceso.
          </p>
          <p className="mt-1">
            Si la pantalla anterior fallo, tu envio ya quedo guardado. Revisa
            tus confirmaciones enviadas y espera la revision.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Confirmaciones", value: confirmations.length },
          { label: "Pendientes", value: pendingCount },
          { label: "Confirmadas", value: confirmedCount },
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
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Confirmaciones enviadas
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Cuando confirmas un pago, aparece aqui para que puedas darle
              seguimiento.
            </p>
          </div>
          <Link
            href="/informacion?comprar=1"
            className="rounded-lg bg-brand-500 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-brand-600"
          >
            Comprar plan
          </Link>
        </div>

        {confirmations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <th className="px-5 py-3 font-medium">Producto / plan</th>
                  <th className="px-5 py-3 font-medium">Metodo</th>
                  <th className="px-5 py-3 font-medium">Precio</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {confirmations.map((confirmation) => {
                  const metadata = parseMetadata(confirmation.metadata);
                  const isConfirmed =
                    metadata.purchaseStatus === "confirmed";
                  const isRejected = metadata.purchaseStatus === "rejected";
                  const status = isConfirmed
                    ? "Confirmada"
                    : isRejected
                    ? "Rechazada"
                    : "Pendiente";

                  return (
                    <tr key={confirmation.id}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {metadata.planName || confirmation.message}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {metadata.itemName ||
                            (metadata.commerceType === "license"
                              ? "Licencia"
                              : metadata.commerceType === "rental"
                              ? "Alquiler"
                              : "Movisur Tool")}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm capitalize text-gray-700 dark:text-gray-300">
                        {metadata.method || "binance"}
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {metadata.currency || "USD"} {metadata.price || "-"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            isConfirmed
                              ? "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
                              : isRejected
                              ? "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400"
                              : "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(confirmation.createdAt)}
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
              Todavia no enviaste confirmaciones de pago.
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Compra un plan y confirma el pago para verlo en esta seccion.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
