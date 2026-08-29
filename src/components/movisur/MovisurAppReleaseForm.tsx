"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

const releaseTypes = [
  { value: "stable", label: "Stable" },
  { value: "beta", label: "Beta" },
  { value: "alpha", label: "Alpha" },
];

type AppReleaseFormData = {
  id: string;
  version: string;
  buildNumber: number;
  releaseType: "stable" | "beta" | "alpha";
  distribution: "url" | "file";
  downloadUrl: string;
  changelog: string | null;
  forceUpdate: boolean;
  isActive: boolean;
  showForUsers: boolean;
  showForCreators: boolean;
};

type MovisurAppReleaseFormProps = {
  initialRelease?: AppReleaseFormData;
  returnPath?: string;
};

export default function MovisurAppReleaseForm({
  initialRelease,
  returnPath = "/admin/apk",
}: MovisurAppReleaseFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialRelease);
  const [mode, setMode] = useState<"url" | "file">(
    initialRelease?.distribution ?? "url"
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
        ? `/api/admin/app-releases/${initialRelease?.id}`
        : "/api/admin/app-releases"
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
        setError(payload?.message ?? "No se pudo guardar el APK.");
        return;
      }

      setProgress(100);
      router.push(returnPath);
      router.refresh();
    };

    request.onerror = () => {
      setIsSubmitting(false);
      setError("La subida se interrumpio. Revisa la conexion o usa una URL.");
    };

    request.send(formData);
  }

  const inputClass =
    "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {isEditing ? "Editar APK" : "Nuevo APK"}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Versiones separadas para la aplicacion Movisur. No afecta las versiones
          de la tool.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Version *
          </span>
          <input
            name="version"
            required
            defaultValue={initialRelease?.version}
            placeholder="1.0.0"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Build *
          </span>
          <input
            name="buildNumber"
            type="number"
            min="1"
            required
            defaultValue={initialRelease?.buildNumber}
            placeholder="1"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tipo
          </span>
          <select
            name="releaseType"
            defaultValue={initialRelease?.releaseType ?? "stable"}
            className={inputClass}
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
          defaultValue={initialRelease?.changelog ?? ""}
          placeholder="- Nuevo login&#10;- Mejoras en notificaciones"
          className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
        />
      </label>

      <div className="mt-6">
        <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Modo de distribucion
        </span>
        <div className="flex flex-wrap gap-3">
          {(["url", "file"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${
                mode === value
                  ? "border-brand-500 bg-brand-50 text-brand-500"
                  : "border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              }`}
            >
              {value === "url" ? "URL de descarga" : "Subir APK"}
            </button>
          ))}
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
            defaultValue={initialRelease?.downloadUrl}
            placeholder="https://www.movisur.net/releases/app.apk"
            className={inputClass}
          />
        </label>
      ) : (
        <div className="mt-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Archivo APK
            </span>
            <input
              name="file"
              type="file"
              accept=".apk,application/vnd.android.package-archive"
              className="h-11 w-full overflow-hidden rounded-lg border border-gray-300 bg-transparent text-sm text-gray-500 shadow-theme-xs file:mr-5 file:cursor-pointer file:border-0 file:border-r file:border-gray-200 file:bg-gray-50 file:px-4 file:py-3 file:text-sm file:text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:file:border-gray-800 dark:file:bg-white/[0.03] dark:file:text-gray-400"
            />
          </label>

          {(isSubmitting || progress > 0) && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
                <span>Subiendo APK</span>
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
        {[
          {
            name: "isActive",
            title: "APK activo",
            description: "Permite que esta version pueda ser entregada a la app.",
            checked: initialRelease?.isActive ?? true,
          },
          {
            name: "forceUpdate",
            title: "Forzar actualizacion",
            description: "La app puede obligar a actualizar si el build instalado es menor.",
            checked: initialRelease?.forceUpdate ?? false,
          },
          {
            name: "showForUsers",
            title: "Mostrar a usuarios",
            description: "Disponible para cuentas con rol usuario.",
            checked: initialRelease?.showForUsers ?? true,
          },
          {
            name: "showForCreators",
            title: "Mostrar a creadores",
            description: "Disponible para cuentas con rol creador.",
            checked: initialRelease?.showForCreators ?? true,
          },
        ].map((option) => (
          <label
            key={option.name}
            className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <input
              name={option.name}
              type="checkbox"
              defaultChecked={option.checked}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <span>
              <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                {option.title}
              </span>
              <span className="mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400">
                {option.description}
              </span>
            </span>
          </label>
        ))}
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
            : "Crear APK"}
        </button>
      </div>
    </form>
  );
}
