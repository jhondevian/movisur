import AdminPurchaseActions from "@/components/movisur/AdminPurchaseActions";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PaymentMetadata = {
  method?: string;
  commerceType?: "license" | "rental";
  itemName?: string;
  assignedAccountId?: string;
  assignedAccountStatus?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  planId?: string;
  planName?: string;
  durationMonths?: number;
  price?: string;
  currency?: string;
  purchaseStatus?: string;
  confirmedAt?: string;
  confirmedById?: string;
  confirmedByName?: string;
  confirmedByEmail?: string;
  proofImageUrl?: string;
  [key: string]: unknown;
};

function parseMetadata(metadata: string | null): PaymentMetadata {
  if (!metadata) return {};

  try {
    return JSON.parse(metadata) as PaymentMetadata;
  } catch {
    return {};
  }
}

function formatDate(date: Date | string | undefined) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03]">
      <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <div className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
        {value || "-"}
      </div>
    </div>
  );
}

export default async function AdminCompraDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const confirmation = await prisma.adminNotification.findFirst({
    where: {
      id,
      type: "binance_payment_confirmation",
      recipientUserId: null,
    },
  });

  if (!confirmation) notFound();

  const metadata = parseMetadata(confirmation.metadata);
  const isConfirmed = metadata.purchaseStatus === "confirmed";
  const durationText = metadata.durationMonths
    ? metadata.commerceType === "rental"
      ? `${metadata.durationMonths} hora${
          metadata.durationMonths === 1 ? "" : "s"
        }`
      : `${metadata.durationMonths} mes${
          metadata.durationMonths === 1 ? "" : "es"
        }`
    : "-";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/compras"
            className="text-sm font-medium text-brand-500 hover:text-brand-600"
          >
            Volver a compras
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
            Detalle de compra
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Datos completos de la solicitud enviada por el usuario.
          </p>
        </div>
        <AdminPurchaseActions
          id={confirmation.id}
          isConfirmed={isConfirmed}
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-3 border-b border-gray-100 pb-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {metadata.planName || confirmation.message}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Solicitud creada el {formatDate(confirmation.createdAt)}
            </p>
          </div>
          <span
            className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${
              isConfirmed
                ? "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
                : "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400"
            }`}
          >
            {isConfirmed ? "Confirmada" : "Pendiente"}
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <DetailItem label="Usuario" value={metadata.userName} />
          <DetailItem label="Correo" value={metadata.userEmail} />
          <DetailItem label="ID usuario" value={metadata.userId} />
          <DetailItem
            label="Producto"
            value={metadata.itemName || "Movisur Tool"}
          />
          <DetailItem
            label="Tipo"
            value={
              metadata.commerceType === "license"
                ? "Licencia"
                : metadata.commerceType === "rental"
                ? "Alquiler"
                : "Movisur Tool"
            }
          />
          <DetailItem label="Plan" value={metadata.planName} />
          <DetailItem label="ID plan" value={metadata.planId} />
          <DetailItem
            label="Duracion"
            value={durationText}
          />
          <DetailItem label="Metodo" value={metadata.method || "binance"} />
          <DetailItem
            label="Precio"
            value={`${metadata.currency || "USD"} ${metadata.price || "-"}`}
          />
          <DetailItem label="Titulo" value={confirmation.title} />
          <DetailItem label="Mensaje" value={confirmation.message} />
          <DetailItem label="Fecha solicitud" value={formatDate(confirmation.createdAt)} />
          <DetailItem label="Confirmado por" value={metadata.confirmedByName} />
          <DetailItem label="Correo admin" value={metadata.confirmedByEmail} />
          <DetailItem
            label="Cuenta asignada"
            value={
              metadata.assignedAccountStatus === "asignada"
                ? metadata.assignedAccountId
                : metadata.assignedAccountStatus === "sin_cuentas_disponibles"
                ? "Sin cuentas disponibles"
                : "-"
            }
          />
          <DetailItem
            label="Fecha confirmacion"
            value={formatDate(metadata.confirmedAt)}
          />
        </div>
      </div>

      {metadata.proofImageUrl ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Comprobante de pago
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Imagen enviada por el usuario antes de confirmar.
              </p>
            </div>
            <a
              href={metadata.proofImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-brand-500 hover:text-brand-600"
            >
              Abrir imagen
            </a>
          </div>
          <div className="relative mt-5 h-96 overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-900">
            <Image
              src={metadata.proofImageUrl}
              alt="Comprobante de pago"
              fill
              sizes="(max-width: 768px) 100vw, 900px"
              className="object-contain p-3"
            />
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Metadata completa
        </h2>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-gray-950 p-4 text-xs leading-6 text-gray-100">
          {JSON.stringify(metadata, null, 2)}
        </pre>
      </div>
    </div>
  );
}
