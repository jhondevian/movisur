"use client";

import type {
  MovisurBrandCategory,
  MovisurProductFile,
} from "@/generated/prisma/client";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type ProductFileFormData = Pick<
  MovisurProductFile,
  | "id"
  | "name"
  | "categoryId"
  | "description"
  | "imageUrl"
  | "distribution"
  | "downloadUrl"
  | "fileType"
  | "isActive"
  | "isForSale"
  | "sortOrder"
  | "createdById"
>;

type MovisurProductFileFormProps = {
  categories: Pick<MovisurBrandCategory, "id" | "name">[];
  initialFile?: ProductFileFormData;
  owners?: {
    email: string;
    firstName: string;
    id: string;
    lastName: string;
    role: string;
  }[];
  returnPath?: string;
};

type DistributionMode = "url" | "zip" | "file" | "video";

const distributionOptions: {
  value: DistributionMode;
  label: string;
  helper: string;
  accept?: string;
}[] = [
  {
    value: "url",
    label: "URL de descarga",
    helper: "Pega un enlace externo de descarga o video.",
  },
  {
    value: "zip",
    label: "Subir ZIP",
    helper: "Paquete comprimido .zip.",
    accept: ".zip,application/zip,application/x-zip-compressed",
  },
  {
    value: "file",
    label: "Subir archivo",
    helper: "Archivo directo como PDF, EXE, RAR u otro recurso.",
  },
  {
    value: "video",
    label: "Subir video",
    helper: "Video MP4, WebM o MOV.",
    accept: "video/mp4,video/webm,video/quicktime",
  },
];

export default function MovisurProductFileForm({
  categories,
  initialFile,
  owners = [],
  returnPath = "/admin/archivos",
}: MovisurProductFileFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialFile);
  const [mode, setMode] = useState<DistributionMode>(
    initialFile?.distribution === "url"
      ? "url"
      : ((initialFile?.fileType as DistributionMode | undefined) ?? "zip")
  );
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(initialFile?.imageUrl ?? "");
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
    formData.set("fileType", mode);

    if (mode === "url") {
      formData.delete("file");
    } else {
      formData.delete("downloadUrl");
    }

    const request = new XMLHttpRequest();
    request.open(
      isEditing ? "PATCH" : "POST",
      isEditing
        ? `/api/admin/movisur/product-files/${initialFile?.id}`
        : "/api/admin/movisur/product-files"
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
        setError(payload?.message ?? "No se pudo guardar el archivo.");
        return;
      }

      setProgress(100);
      router.push(returnPath);
      router.refresh();
    };

    request.onerror = () => {
      setIsSubmitting(false);
      setError("La subida se interrumpio. Intenta nuevamente.");
    };

    request.send(formData);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {isEditing ? "Editar archivo" : "Nuevo archivo"}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Este archivo es un producto independiente. No afecta las versiones de
          Movisur Tool.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nombre del producto *
          </span>
          <input
            name="name"
            required
            defaultValue={initialFile?.name}
            placeholder="Paquete Samsung FRP"
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Categoria
          </span>
          <select
            name="categoryId"
            defaultValue={initialFile?.categoryId ?? ""}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            <option value="">Sin categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {owners.length > 0 ? (
        <label className="mt-5 block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Propietario
          </span>
          <select
            name="createdById"
            defaultValue={initialFile?.createdById ?? ""}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            <option value="">Sin propietario</option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {`${owner.firstName} ${owner.lastName}`.trim()} - {owner.email} -{" "}
                {owner.role}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Solo los administradores pueden cambiar el propietario del archivo.
          </p>
        </label>
      ) : null}

      <label className="mt-5 block">
        <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Descripcion
        </span>
        <textarea
          name="description"
          rows={4}
          defaultValue={initialFile?.description ?? ""}
          placeholder="Describe que contiene este producto o archivo."
          className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
        />
      </label>

      <div className="mt-5 grid gap-4 md:grid-cols-[160px_1fr] md:items-center">
        <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Vista previa del producto"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="px-4 text-center text-xs text-gray-500 dark:text-gray-400">
              Sin imagen
            </span>
          )}
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Imagen del producto
          </span>
          <input
            name="image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setPreviewUrl(URL.createObjectURL(file));
            }}
            className="h-11 w-full overflow-hidden rounded-lg border border-gray-300 bg-transparent text-sm text-gray-500 shadow-theme-xs file:mr-5 file:cursor-pointer file:border-0 file:border-r file:border-gray-200 file:bg-gray-50 file:px-4 file:py-3 file:text-sm file:text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:file:border-gray-800 dark:file:bg-white/[0.03] dark:file:text-gray-400"
          />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            PNG, JPG o WebP. Maximo 2 MB.
          </p>
        </label>
      </div>

      <div className="mt-6">
        <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Modo de distribucion
        </span>
        <div className="flex flex-wrap gap-3">
          {distributionOptions.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setMode(item.value)}
              className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${
                mode === item.value
                  ? "border-brand-500 bg-brand-50 text-brand-500"
                  : "border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              }`}
            >
              {item.label}
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
            defaultValue={initialFile?.downloadUrl}
            placeholder="https://tusitio.com/recurso"
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
        </label>
      ) : (
        <div className="mt-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {distributionOptions.find((item) => item.value === mode)?.label}
            </span>
            <input
              name="file"
              type="file"
              accept={
                distributionOptions.find((item) => item.value === mode)?.accept
              }
              className="h-11 w-full overflow-hidden rounded-lg border border-gray-300 bg-transparent text-sm text-gray-500 shadow-theme-xs file:mr-5 file:cursor-pointer file:border-0 file:border-r file:border-gray-200 file:bg-gray-50 file:px-4 file:py-3 file:text-sm file:text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:file:border-gray-800 dark:file:bg-white/[0.03] dark:file:text-gray-400"
            />
          </label>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {distributionOptions.find((item) => item.value === mode)?.helper}
          </p>

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

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Orden
          </span>
          <input
            name="sortOrder"
            type="number"
            min="0"
            defaultValue={initialFile?.sortOrder ?? 0}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
        </label>

        <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <input
            name="isActive"
            type="checkbox"
            defaultChecked={initialFile?.isActive ?? true}
            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
          />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            Activo
          </span>
        </label>

        <label className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-500/20 dark:bg-brand-500/10">
          <input
            name="isForSale"
            type="checkbox"
            defaultChecked={initialFile?.isForSale ?? false}
            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
          />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            Disponible para venta
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
            : "Crear archivo"}
        </button>
      </div>
    </form>
  );
}
