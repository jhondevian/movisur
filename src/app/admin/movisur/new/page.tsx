import NewMovisurVersionForm from "@/components/movisur/NewMovisurVersionForm";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Nueva version | Movisur",
  description: "Crear una nueva version descargable de Movisur Tool",
};

export default function NewMovisurVersionPage() {
  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Control de versiones
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Crea una version nueva para publicarla en el frontend.
          </p>
        </div>

        <Link
          href="/admin/movisur"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
        >
          Volver al listado
        </Link>
      </div>

      <NewMovisurVersionForm />
    </div>
  );
}
