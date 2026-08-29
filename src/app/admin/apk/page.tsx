import MovisurAppReleasesTable from "@/components/movisur/MovisurAppReleasesTable";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "APK de la app | Movisur",
  description: "Gestiona versiones APK de la aplicacion Movisur",
};

export default async function MovisurAppReleasesPage() {
  const releases = await prisma.movisurAppRelease.findMany({
    orderBy: [{ buildNumber: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            APK de la aplicacion
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Controla versiones, builds, actualizaciones forzadas y para que rol
            aparece cada APK.
          </p>
        </div>

        <Link
          href="/admin/apk/new"
          className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600"
        >
          + Nuevo APK
        </Link>
      </div>

      <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        {releases.length} APK registrados
      </p>

      <MovisurAppReleasesTable releases={releases} />
    </div>
  );
}
