import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Aplicacion disponible | Movisur",
  description: "Descarga la version de la aplicacion Movisur para creadores",
};

function formatSize(bytes: number | bigint | null) {
  if (!bytes) return "URL externa";
  const mb = Number(bytes) / 1024 / 1024;
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(1)} MB`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function CreadorAplicacionPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) redirect("/signin?next=/creador/aplicacion");

  let user;

  try {
    user = await verifyAuthToken(token);
  } catch {
    redirect("/signin?next=/creador/aplicacion");
  }

  if (user.role !== "creador" && user.role !== "admin") {
    redirect(`/${user.role}`);
  }

  const [latestRelease, previousReleases] = await Promise.all([
    prisma.movisurAppRelease.findFirst({
      where: {
        platform: "android",
        isActive: true,
        showForCreators: true,
      },
      orderBy: [{ buildNumber: "desc" }, { createdAt: "desc" }],
    }),
    prisma.movisurAppRelease.findMany({
      where: {
        platform: "android",
        isActive: true,
        showForCreators: true,
      },
      orderBy: [{ buildNumber: "desc" }, { createdAt: "desc" }],
      skip: 1,
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-brand-500">
          Movisur App
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
          Aplicacion disponible
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Descarga la version habilitada para creadores y manten tu panel movil
          conectado con compras, cuentas y notificaciones.
        </p>
      </div>

      {latestRelease ? (
        <>
          <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gray-950 p-6 text-white shadow-theme-lg dark:border-gray-800">
            <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-brand-500/25 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-cyan-400/15 blur-3xl" />

            <div className="relative grid gap-8 lg:grid-cols-[1fr_320px] lg:items-center">
              <div>
                <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/15">
                  {latestRelease.releaseType.toUpperCase()}
                </span>
                <h2 className="mt-5 text-4xl font-black tracking-[-0.5px] sm:text-5xl">
                  Movisur v{latestRelease.version}
                </h2>
                <p className="mt-3 text-base text-white/70">
                  Build {latestRelease.buildNumber} -{" "}
                  {formatSize(latestRelease.fileSize)}
                </p>

                {latestRelease.changelog ? (
                  <p className="mt-6 max-w-2xl whitespace-pre-line text-sm leading-6 text-white/72">
                    {latestRelease.changelog}
                  </p>
                ) : (
                  <p className="mt-6 max-w-2xl text-sm leading-6 text-white/72">
                    Version preparada para el flujo de creadores: gestion de
                    cuentas, compras y avisos desde la app.
                  </p>
                )}

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={`/api/movisur/app-releases/${latestRelease.id}/download?role=creador`}
                    className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-white shadow-theme-md transition hover:bg-brand-600"
                  >
                    Descargar APK
                  </Link>
                  <span className="inline-flex items-center justify-center rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white/80">
                    {latestRelease.forceUpdate
                      ? "Actualizacion obligatoria"
                      : "Actualizacion recomendada"}
                  </span>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/8 p-5 backdrop-blur">
                <div className="flex h-64 flex-col items-center justify-center rounded-2xl bg-white text-gray-950">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-950 text-3xl font-black text-white shadow-theme-md">
                    M
                  </div>
                  <p className="mt-5 text-lg font-black">Movisur</p>
                  <p className="mt-1 text-sm text-gray-500">Creator App</p>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Version", value: `v${latestRelease.version}` },
              { label: "Build", value: latestRelease.buildNumber },
              { label: "Publicado", value: formatDate(latestRelease.createdAt) },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
              >
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {item.label}
                </p>
                <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {previousReleases.length > 0 ? (
            <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Versiones anteriores
              </h2>
              <div className="mt-5 divide-y divide-gray-100 dark:divide-white/[0.06]">
                {previousReleases.map((release) => (
                  <div
                    key={release.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        v{release.version} - build {release.buildNumber}
                      </p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {formatSize(release.fileSize)} -{" "}
                        {formatDate(release.createdAt)}
                      </p>
                    </div>
                    <Link
                      href={`/api/movisur/app-releases/${release.id}/download?role=creador`}
                      className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    >
                      Descargar
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <section className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-2xl font-black text-gray-700 dark:bg-white/[0.06] dark:text-white">
            M
          </div>
          <h2 className="mt-5 text-xl font-bold text-gray-900 dark:text-white">
            Aun no hay APK para creadores
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
            Cuando el admin publique una version marcada para creadores,
            aparecera aqui con su boton de descarga.
          </p>
        </section>
      )}
    </div>
  );
}
