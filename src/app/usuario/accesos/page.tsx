import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AccessCountdown from "@/components/frontend/AccessCountdown";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mis accesos | Movisur",
  description: "Cuentas asignadas por compras confirmadas",
};

function formatDate(date: Date | null) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function AccessCard({
  type,
  title,
  plan,
  username,
  password,
  note,
  assignedAt,
  assignedExpiresAt,
}: {
  type: string;
  title: string;
  plan: string;
  username: string;
  password: string;
  note: string | null;
  assignedAt: Date | null;
  assignedExpiresAt: Date | null;
}) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            {type}
          </span>
          <h2 className="mt-3 text-lg font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {plan}
          </p>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Asignado: {formatDate(assignedAt)}
        </p>
      </div>
      {assignedExpiresAt ? (
        <p className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          Tiempo restante:{" "}
          <AccessCountdown expiresAt={assignedExpiresAt.toISOString()} />
        </p>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Usuario</p>
          <p className="mt-2 break-all font-semibold text-gray-900 dark:text-white">
            {username}
          </p>
        </div>
        <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Contrasena
          </p>
          <p className="mt-2 break-all font-semibold text-gray-900 dark:text-white">
            {password}
          </p>
        </div>
      </div>

      {note ? (
        <p className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-900 dark:text-gray-300">
          {note}
        </p>
      ) : null}
    </article>
  );
}

export default async function UsuarioAccesosPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) redirect("/signin?next=/usuario/accesos");

  let user;

  try {
    user = await verifyAuthToken(token);
  } catch {
    redirect("/signin?next=/usuario/accesos");
  }

  const [licenseAccounts, rentalAccounts] = await Promise.all([
    prisma.creatorLicenseAccount.findMany({
      where: {
        assignedToId: user.id,
        isActive: true,
        OR: [
          { assignedExpiresAt: null },
          { assignedExpiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { assignedAt: "desc" },
      include: {
        offer: {
          include: {
            product: true,
            plan: true,
          },
        },
      },
    }),
    prisma.creatorRentalAccount.findMany({
      where: {
        assignedToId: user.id,
        isActive: true,
        OR: [
          { assignedExpiresAt: null },
          { assignedExpiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { assignedAt: "desc" },
      include: {
        offer: {
          include: {
            tool: true,
            plan: true,
          },
        },
      },
    }),
  ]);

  const totalAccounts = licenseAccounts.length + rentalAccounts.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Mis accesos
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Aqui apareceran automaticamente las cuentas cuando una compra de
          licencia o alquiler sea confirmada.
        </p>
      </div>

      {totalAccounts > 0 ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {licenseAccounts.map((account) => (
            <AccessCard
              key={account.id}
              type="Licencia"
              title={account.offer.product.name}
              plan={account.offer.plan.name}
              username={account.username}
              password={account.password}
              note={account.note}
              assignedAt={account.assignedAt}
              assignedExpiresAt={account.assignedExpiresAt}
            />
          ))}
          {rentalAccounts.map((account) => (
            <AccessCard
              key={account.id}
              type="Alquiler"
              title={account.offer.tool.name}
              plan={account.offer.plan.name}
              username={account.username}
              password={account.password}
              note={account.note}
              assignedAt={account.assignedAt}
              assignedExpiresAt={account.assignedExpiresAt}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Todavia no tienes accesos asignados
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Cuando tu compra sea confirmada y exista una cuenta disponible,
            aparecera aqui.
          </p>
        </div>
      )}
    </div>
  );
}
