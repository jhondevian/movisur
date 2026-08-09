import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recuperar contraseña | Movisur",
  description: "Recuperacion de acceso para cuentas Movisur.",
};

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 text-gray-900 dark:bg-gray-950 dark:text-white">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-theme-lg dark:border-gray-800 dark:bg-white/[0.03]">
        <h1 className="text-2xl font-bold">Recuperar contraseña</h1>
        <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
          La recuperacion automatica todavia no esta disponible. Contacta al
          administrador de Movisur para restablecer tu acceso.
        </p>
        <Link
          href="/signin"
          className="mt-6 inline-flex rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          Volver al login
        </Link>
      </section>
    </main>
  );
}
