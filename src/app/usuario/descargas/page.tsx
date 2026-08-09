import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function formatSize(bytes: number | null) {
  if (!bytes) return "Archivo remoto";
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(1)} MB`;
}

export default async function UsuarioDescargasPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) redirect("/signin?next=/usuario/descargas");

  let user;

  try {
    user = await verifyAuthToken(token);
  } catch {
    redirect("/signin?next=/usuario/descargas");
  }

  const [freeVersion, saleVersion, confirmedPurchase] = await Promise.all([
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
    prisma.adminNotification.findFirst({
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
        id: true,
      },
    }),
  ]);

  const availableVersion = freeVersion || saleVersion;
  const requiresPurchase = Boolean(availableVersion?.isSaleVersion);
  const canDownload = Boolean(
    availableVersion && (!requiresPurchase || confirmedPurchase)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Descargas
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Acceso a versiones disponibles de Movisur Tool segun su estado de
          publicacion.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          {
            label: "Version disponible",
            value: availableVersion ? `v${availableVersion.version}` : "-",
          },
          {
            label: "Acceso",
            value: requiresPurchase
              ? confirmedPurchase
                ? "Compra confirmada"
                : "Requiere compra"
              : "Gratis",
          },
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

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        {availableVersion ? (
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-brand-500">
                Movisur Tool
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                Version v{availableVersion.version}
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {requiresPurchase ? "Version de venta" : "Version gratis"} -
                {formatSize(availableVersion.fileSize)}
              </p>
              {availableVersion.changelog ? (
                <p className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-6 text-gray-600 dark:text-gray-300">
                  {availableVersion.changelog}
                </p>
              ) : null}
            </div>

            {canDownload ? (
              <Link
                href="/api/usuario/movisur/download"
                className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                Descargar
              </Link>
            ) : (
              <Link
                href="/usuario/compras"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              >
                Ver estado de compra
              </Link>
            )}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Todavia no hay una version activa.
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              El administrador debe publicar una version gratis o de venta.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
