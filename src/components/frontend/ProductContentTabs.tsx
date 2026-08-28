"use client";

import { DownloadIcon, InfoIcon, TimeIcon } from "@/icons";
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
  opensNewTab: boolean;
};

type ProductContentTabsProps = {
  description: string;
  actionHref: string;
  actionLabel: string;
  canAccess: boolean;
  actionOpensNewTab: boolean;
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
  actionOpensNewTab,
  requiresPurchase,
  revisions,
}: ProductContentTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("description");

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-5">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex min-h-[64px] min-w-0 items-center justify-center gap-3 rounded-lg border px-4 text-base font-semibold transition sm:min-h-[74px] sm:px-5 sm:text-2xl ${
                isActive
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-gray-900 bg-white text-gray-950 hover:border-brand-500 hover:text-brand-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:hover:border-brand-400 dark:hover:text-brand-400"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" />
              <span className="min-w-0 truncate">{label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 border-t border-gray-200 pt-8 dark:border-gray-800">
        {activeTab === "description" ? (
          <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
            <div className="min-w-0">
              <h2 className="text-2xl font-extrabold text-gray-950 dark:text-white">
                Detalles del producto
              </h2>
              <div
                className="mt-4 min-w-0 overflow-hidden break-words text-base leading-8 text-gray-600 dark:text-gray-400 [&_*]:max-w-full [&_a]:break-all [&_a]:font-semibold [&_a]:text-brand-500 [&_img]:h-auto [&_img]:max-w-full [&_li]:ml-5 [&_li]:list-disc [&_pre]:overflow-x-auto [&_strong]:text-gray-950 dark:[&_strong]:text-white"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            </div>
            <div className="min-w-0">
              <div className="p-2 sm:p-4">
                {canAccess ? (
                  <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
                    <DownloadIcon className="h-7 w-7" />
                  </div>
                ) : null}
                <h2 className="break-words text-2xl font-extrabold leading-tight text-gray-950 dark:text-white sm:text-3xl">
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
                  <a
                    href={actionHref}
                    target={actionOpensNewTab ? "_blank" : undefined}
                    rel={actionOpensNewTab ? "noopener noreferrer" : undefined}
                    className="mt-7 inline-flex w-full items-center justify-center rounded-lg bg-brand-500 px-6 py-4 text-base font-semibold text-white transition hover:bg-brand-600"
                  >
                    {actionLabel}
                  </a>
                ) : null}
                {!canAccess ? (
                  <a
                    href={actionHref}
                    className="mt-5 block text-center text-sm font-semibold text-brand-500 transition hover:text-brand-600"
                  >
                    {requiresPurchase ? "Ver planes disponibles" : actionLabel}
                  </a>
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
                  className="grid min-w-0 gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                    <div className="min-w-0">
                      <p className="break-words text-base font-bold text-gray-950 dark:text-white">
                        v{revision.versionNumber}
                      </p>
                      <p className="mt-1 break-words text-sm text-gray-500 dark:text-gray-400">
                        {revision.fileType} - {revision.fileSize}
                      </p>
                    </div>
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                      <span className="text-sm font-semibold text-gray-400">
                        {formatUploadedAt(revision.uploadedAt)}
                      </span>
                      <a
                        href={revision.downloadHref}
                        target={
                          revision.canDownload && revision.opensNewTab
                            ? "_blank"
                            : undefined
                        }
                        rel={
                          revision.canDownload && revision.opensNewTab
                            ? "noopener noreferrer"
                            : undefined
                        }
                        className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition sm:w-auto ${
                          revision.canDownload
                            ? "bg-brand-500 text-white hover:bg-brand-600"
                            : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        }`}
                      >
                        {revision.canDownload ? "Descargar" : "Requiere plan"}
                      </a>
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
