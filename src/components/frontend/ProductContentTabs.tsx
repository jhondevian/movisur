"use client";

import { DownloadIcon, InfoIcon, TimeIcon } from "@/icons";
import Link from "next/link";
import { useState } from "react";

type ProductRevision = {
  id: string;
  versionNumber: number;
  fileType: string;
  fileSize: string;
  isCurrent: boolean;
  uploadedAt: string;
  downloadHref: string;
  canDownload: boolean;
};

type ProductContentTabsProps = {
  description: string;
  actionHref: string;
  actionLabel: string;
  canAccess: boolean;
  requiresPurchase: boolean;
  revisions: ProductRevision[];
};

const tabs = [
  { id: "description", label: "Descripcion", Icon: InfoIcon },
  { id: "changelogs", label: "Cambios", Icon: TimeIcon },
] as const;

type TabId = (typeof tabs)[number]["id"];

function formatUploadedAt(value: string) {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function ProductContentTabs({
  description,
  actionHref,
  actionLabel,
  canAccess,
  requiresPurchase,
  revisions,
}: ProductContentTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("description");

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-5 md:grid-cols-2">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex h-[74px] items-center justify-center gap-3 rounded-lg border px-5 text-xl font-semibold transition sm:text-2xl ${
                isActive
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-gray-900 bg-white text-gray-950 hover:border-brand-500 hover:text-brand-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:hover:border-brand-400 dark:hover:text-brand-400"
              }`}
            >
              <Icon className="h-6 w-6" />
              {label}
            </button>
          );
        })}
      </div>

      <div className="mt-8 border-t border-gray-200 pt-8 dark:border-gray-800">
        {activeTab === "description" ? (
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-950 dark:text-white">
                Detalles del producto
              </h2>
              <div
                className="mt-4 text-base leading-8 text-gray-600 dark:text-gray-400 [&_a]:font-semibold [&_a]:text-brand-500 [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-gray-950 dark:[&_strong]:text-white"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            </div>
            <div>
              <div className="p-2 sm:p-4">
                {canAccess ? (
                  <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
                    <DownloadIcon className="h-7 w-7" />
                  </div>
                ) : null}
                <h2 className="text-3xl font-extrabold leading-tight text-gray-950 dark:text-white">
                  {canAccess
                    ? "Descarga disponible"
                    : "Accede a descargas ilimitadas"}
                </h2>
                <p className="mt-4 text-base leading-7 text-gray-600 dark:text-gray-400">
                  {canAccess
                    ? "Tu plan ya esta confirmado. Puedes descargar este archivo y las versiones disponibles."
                    : requiresPurchase
                    ? "Compra un plan para descargar herramientas, videos y archivos premium de Movisur."
                    : "Inicia sesion para descargar este producto libre y guardar tu historial de descargas."}
                </p>
                {canAccess ? (
                  <Link
                    href={actionHref}
                    className="mt-7 inline-flex w-full items-center justify-center rounded-lg bg-brand-500 px-6 py-4 text-base font-semibold text-white transition hover:bg-brand-600"
                  >
                    {actionLabel}
                  </Link>
                ) : null}
                {!canAccess ? (
                  <Link
                    href={actionHref}
                    className="mt-5 block text-center text-sm font-semibold text-brand-500 transition hover:text-brand-600"
                  >
                    {requiresPurchase ? "Ver planes disponibles" : actionLabel}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "changelogs" ? (
          <div>
            <h2 className="text-2xl font-extrabold text-gray-950 dark:text-white">
              Historial de versiones
            </h2>
            <div className="mt-5 divide-y divide-gray-200 dark:divide-gray-800">
              {revisions.length ? (
                revisions.map((revision) => (
                  <div
                    key={revision.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-base font-bold text-gray-950 dark:text-white">
                        v{revision.versionNumber}
                      </p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {revision.fileType} - {revision.fileSize}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-400">
                        {formatUploadedAt(revision.uploadedAt)}
                      </span>
                      <Link
                        href={revision.downloadHref}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                          revision.canDownload
                            ? "bg-brand-500 text-white hover:bg-brand-600"
                            : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        }`}
                      >
                        {revision.canDownload ? "Descargar" : "Requiere plan"}
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  Sin historial disponible.
                </p>
              )}
            </div>
          </div>
        ) : null}

      </div>
    </section>
  );
}
