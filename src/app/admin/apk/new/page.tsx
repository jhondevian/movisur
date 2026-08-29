import MovisurAppReleaseForm from "@/components/movisur/MovisurAppReleaseForm";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Nuevo APK | Movisur",
  description: "Crear una version APK de la aplicacion Movisur",
};

export default function NewMovisurAppReleasePage() {
  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/apk"
          className="text-sm font-medium text-brand-500 hover:text-brand-600"
        >
          Volver a APK
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
          Nuevo APK
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Crea una version nueva para la aplicacion Movisur.
        </p>
      </div>

      <MovisurAppReleaseForm />
    </div>
  );
}
