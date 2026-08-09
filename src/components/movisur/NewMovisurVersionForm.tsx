"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

const releaseTypes = [
  { value: "stable", label: "Stable" },
  { value: "beta", label: "Beta" },
  { value: "alpha", label: "Alpha" },
];

type VersionFormData = {
  id: string;
  version: string;
  releaseType: "stable" | "beta" | "alpha";
  distribution: "url" | "file";
  downloadUrl: string;
  changelog: string | null;
  isActive: boolean;
  isSaleVersion: boolean;
};

type NewMovisurVersionFormProps = {
  initialVersion?: VersionFormData;
  returnPath?: string;
  heading?: string;
  description?: string;
  submitLabel?: string;
};

export default function NewMovisurVersionForm({
  initialVersion,
  returnPath = "/admin/movisur",
  heading,
  description,
  submitLabel,
}: NewMovisurVersionFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialVersion);
  const [mode, setMode] = useState<"url" | "file">(
    initialVersion?.distribution ?? "url"
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const uploadKey = useMemo(() => crypto.randomUUID(), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setError("");
    setProgress(0);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    formData.set("uploadKey", uploadKey);

    if (mode === "url") {
      formData.delete("file");
    } else {
      formData.delete("downloadUrl");
    }

    const request = new XMLHttpRequest();
    request.open(
      isEditing ? "PATCH" : "POST",
      isEditing
        ? `/api/admin/movisur/versions/${initialVersion?.id}`
        : "/api/admin/movisur/versions"
    );

    request.upload.onprogress = (progressEvent) => {
      if (!progressEvent.lengthComputable) return;
      setProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
    };

    request.onload = () => {
      setIsSubmitting(false);

      if (request.status < 200 || request.status >= 300) {
        const payload = (() => {
          try {
            return JSON.parse(request.responseText || "{}") as {
              message?: string;
            };
          } catch {
            return null;
          }
        })();
        if (request.status === 413) {
          setError(
            "El archivo ZIP es demasiado grande para el limite actual del servidor. Sube el limite de carga del VPS/proxy a 512 MB o usa una URL de descarga externa."
          );
          return;
        }

        setError(
          payload?.message ??
            (isEditing
              ? "No se pudo actualizar la version."
              : "No se pudo crear la version.")
        );
        return;
      }

      setProgress(100);
      router.push(returnPath);
      router.refresh();
    };

    request.onerror = () => {
      setIsSubmitting(false);
      setError(
        "La subida se interrumpio. Revisa la conexion o el limite de carga del servidor antes de volver a intentarlo."
      );
    };

    request.send(formData);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {heading ?? (isEditing ? "Editar version" : "Nueva version")}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description ??
              (isEditing
                ? "Actualiza los datos de esta version Movisur."
                : "Agrega una version para que el frontend pueda descargarla.")}
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Version *
          </span>
          <input
            name="version"
            required
            defaultValue={initialVersion?.version}
            placeholder="1.0.0"
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tipo de release
          </span>
          <select
            name="releaseType"
            defaultValue={initialVersion?.releaseType ?? "stable"}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            {releaseTypes.map((releaseType) => (
              <option key={releaseType.value} value={releaseType.value}>
                {releaseType.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-5 block">
        <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Novedades / Changelog
        </span>
        <textarea
          name="changelog"
          rows={4}
          defaultValue={initialVersion?.changelog ?? ""}
          placeholder="- Nueva funcionalidad&#10;- Correccion de errores"
          className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
        />
      </label>

      <div className="mt-6">
        <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Modo de distribucion
        </span>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${
              mode === "url"
                ? "border-brand-500 bg-brand-50 text-brand-500"
                : "border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            }`}
          >
            URL de descarga
          </button>
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${
              mode === "file"
                ? "border-brand-500 bg-brand-50 text-brand-500"
                : "border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            }`}
          >
            Subir archivo ZIP
          </button>
        </div>
      </div>

      {mode === "url" ? (
        <label className="mt-5 block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            URL de descarga
          </span>
          <input
            name="downloadUrl"
            type="url"
            defaultValue={initialVersion?.downloadUrl}
            placeholder="https://tusitio.com/descargas/movisur.zip"
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
        </label>
      ) : (
        <div className="mt-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Archivo ZIP
            </span>
            <input
              name="file"
              type="file"
              accept=".zip"
              className="h-11 w-full overflow-hidden rounded-lg border border-gray-300 bg-transparent text-sm text-gray-500 shadow-theme-xs file:mr-5 file:cursor-pointer file:border-0 file:border-r file:border-gray-200 file:bg-gray-50 file:px-4 file:py-3 file:text-sm file:text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:file:border-gray-800 dark:file:bg-white/[0.03] dark:file:text-gray-400"
            />
          </label>

          {(isSubmitting || progress > 0) && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
                <span>Subiendo archivo</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <input
            name="isActive"
            type="checkbox"
            defaultChecked={initialVersion?.isActive ?? true}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
          />
          <span>
            <span className="block text-sm font-semibold text-gray-900 dark:text-white">
              Version activa
            </span>
            <span className="mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400">
              Permite que esta version pueda aparecer como disponible.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-500/20 dark:bg-brand-500/10">
          <input
            name="isSaleVersion"
            type="checkbox"
            defaultChecked={initialVersion?.isSaleVersion ?? false}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
          />
          <span>
            <span className="block text-sm font-semibold text-gray-900 dark:text-white">
              Activar para venta
            </span>
            <span className="mt-1 block text-xs leading-5 text-gray-600 dark:text-gray-300">
              Sera la version que podran descargar los usuarios con compra
              confirmada.
            </span>
          </span>
        </label>
      </div>

      {error && (
        <div className="mt-5 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10">
          {error}
        </div>
      )}

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => router.push(returnPath)}
          className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
        >
          {isSubmitting
            ? isEditing
              ? "Guardando..."
              : "Creando..."
            : isEditing
            ? "Guardar cambios"
            : submitLabel ?? "Crear version"}
        </button>
      </div>
    </form>
  );
}
