import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panel Usuario | Movisur",
};

type PaymentMetadata = {
  method?: string;
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

function formatDate(date: Date | undefined) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function UsuarioPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) redirect("/signin?next=/usuario");

  let user;

  try {
    user = await verifyAuthToken(token);
  } catch {
    redirect("/signin?next=/usuario");
  }

  const [confirmations, freeVersion, saleVersion] = await Promise.all([
    prisma.adminNotification.findMany({
      where: {
        type: "binance_payment_confirmation",
        metadata: {
          contains: `"userId":"${user.id}"`,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    }),
    prisma.movisurVersion.findFirst({
      where: {
        isActive: true,
        isSaleVersion: false,
      },
      orderBy: [{ buildNumber: "desc" }, { createdAt: "desc" }],
    }),
    prisma.movisurVersion.findFirst({
      where: {
        isActive: true,
        isSaleVersion: true,
      },
      orderBy: [{ buildNumber: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  const confirmed = confirmations.filter((item) => {
    const metadata = parseMetadata(item.metadata);
    return metadata.purchaseStatus === "confirmed";
  });
  const pendingCount = confirmations.length - confirmed.length;
  const latestConfirmation = confirmations[0];
  const latestMetadata = parseMetadata(latestConfirmation?.metadata ?? null);
  const hasConfirmedPurchase = confirmed.length > 0;
  const availableVersion = freeVersion || saleVersion;
  const requiresPurchase = Boolean(availableVersion?.isSaleVersion);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Panel usuario
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Hola {user.firstName}, aqui puedes revisar tus compras, estado de
          pago y descargas disponibles.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Confirmaciones", value: confirmations.length },
          { label: "Pendientes", value: pendingCount },
          { label: "Confirmadas", value: confirmed.length },
          {
            label: "Version disponible",
            value: availableVersion ? `v${availableVersion.version}` : "-",
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

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Estado de tu compra
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {!availableVersion
                  ? "Todavia no hay una version disponible."
                  : requiresPurchase
                  ? "Tu acceso a esta version depende de una compra confirmada por el admin."
                  : "Hay una version gratis disponible para descargar."}
              </p>
            </div>
            <span
              className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${
                availableVersion && (hasConfirmedPurchase || !requiresPurchase)
                  ? "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
                  : "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400"
              }`}
            >
              {!availableVersion
                ? "Sin version"
                : !requiresPurchase
                ? "Gratis"
                : hasConfirmedPurchase
                ? "Compra confirmada"
                : "Pendiente"}
            </span>
          </div>

          {latestConfirmation ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03]">
                <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  Ultimo plan
                </p>
                <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                  {latestMetadata.planName || latestConfirmation.message}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03]">
                <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  Precio
                </p>
                <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                  {latestMetadata.currency || "USD"} {latestMetadata.price || "-"}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03]">
                <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  Metodo
                </p>
                <p className="mt-2 text-sm font-semibold capitalize text-gray-900 dark:text-white">
                  {latestMetadata.method || "binance"}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03]">
                <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  Fecha
                </p>
                <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                  {formatDate(latestConfirmation.createdAt)}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-xl bg-gray-50 p-5 text-sm text-gray-600 dark:bg-white/[0.03] dark:text-gray-300">
              Todavia no tienes compras registradas.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Accesos rapidos
          </h2>
          <div className="mt-5 grid gap-3">
            <Link
              href="/usuario/compras"
              className="rounded-xl bg-gray-50 px-5 py-4 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Ver mis compras
            </Link>
            <Link
              href="/usuario/descargas"
              className="rounded-xl bg-gray-50 px-5 py-4 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Descargar Movisur Tool
            </Link>
            <Link
              href="/informacion?comprar=1"
              className="rounded-xl bg-brand-500 px-5 py-4 text-sm font-medium text-white transition hover:bg-brand-600"
            >
              Comprar otro plan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
