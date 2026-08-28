"use client";

import type {
  MovisurBrandCategory,
  MovisurDeviceModel,
} from "@/generated/prisma/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type MovisurBrandCategoriesFormProps = {
  categories: (MovisurBrandCategory & { models: MovisurDeviceModel[] })[];
};

const categoryTypeOptions = [
  { label: "Marca", value: "brand" },
  { label: "Tool", value: "tool" },
];

export default function MovisurBrandCategoriesForm({
  categories,
}: MovisurBrandCategoriesFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSubmitId, setEditingSubmitId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch("/api/admin/movisur/categories", {
      method: "POST",
      body: formData,
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      setMessage(payload?.message ?? "No se pudo crear la categoria.");
      return;
    }

    form.reset();
    setMessage("Categoria creada.");
    router.refresh();
  }

  async function handleEditSubmit(
    event: FormEvent<HTMLFormElement>,
    id: string
  ) {
    event.preventDefault();
    setMessage("");
    setEditingSubmitId(id);

    const formData = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/movisur/categories/${id}`, {
      method: "PATCH",
      body: formData,
    });

    setEditingSubmitId(null);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      setMessage(payload?.message ?? "No se pudo actualizar la categoria.");
      return;
    }

    setEditingId(null);
    setMessage("Categoria actualizada.");
    router.refresh();
  }

  async function toggleCategory(id: string, isActive: boolean) {
    setMessage("");
    const response = await fetch(`/api/admin/movisur/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });

    if (!response.ok) {
      setMessage("No se pudo actualizar la categoria.");
      return;
    }

    router.refresh();
  }

  async function toggleCategoryHome(id: string, showOnHome: boolean) {
    setMessage("");
    const response = await fetch(`/api/admin/movisur/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showOnHome }),
    });

    if (!response.ok) {
      setMessage("No se pudo actualizar la portada.");
      return;
    }

    router.refresh();
  }

  async function toggleCategoryFrontend(id: string, showInFrontend: boolean) {
    setMessage("");
    const response = await fetch(`/api/admin/movisur/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showInFrontend }),
    });

    if (!response.ok) {
      setMessage("No se pudo actualizar el frontend.");
      return;
    }

    router.refresh();
  }

  async function handleModelSubmit(
    event: FormEvent<HTMLFormElement>,
    categoryId: string
  ) {
    event.preventDefault();
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch(
      `/api/admin/movisur/categories/${categoryId}/models`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      setMessage(payload?.message ?? "No se pudo crear el modelo.");
      return;
    }

    form.reset();
    setMessage("Modelo creado.");
    router.refresh();
  }

  return (
    <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Categorias de marcas
      </h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Crea marcas como Samsung, LG o Xiaomi, o categorias internas para tools
        y archivos.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Marca
          </span>
          <input
            name="name"
            required
            placeholder="Samsung"
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tipo
          </span>
          <select
            name="categoryType"
            defaultValue="brand"
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
          >
            {categoryTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Orden
          </span>
          <input
            name="sortOrder"
            type="number"
            min="0"
            defaultValue="0"
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
          />
        </label>

        <label className="block lg:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Descripcion
          </span>
          <textarea
            name="description"
            rows={3}
            placeholder="Herramienta Movisur preparada para dispositivos Samsung."
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Imagen
          </span>
          <input
            name="image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="h-11 w-full overflow-hidden rounded-lg border border-gray-300 bg-white text-sm text-gray-500 shadow-theme-xs file:mr-5 file:cursor-pointer file:border-0 file:border-r file:border-gray-200 file:bg-gray-50 file:px-4 file:py-3 file:text-sm file:text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400 dark:file:border-gray-800 dark:file:bg-white/[0.03] dark:file:text-gray-400"
          />
        </label>

        <div className="flex items-end justify-between gap-4">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              name="isActive"
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            Activa
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              name="showOnHome"
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            Portada
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              name="showInFrontend"
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            Frontend
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
          >
            {isSubmitting ? "Creando..." : "Crear categoria"}
          </button>
        </div>
      </form>

      {message ? (
        <div className="mt-5 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:bg-white/[0.03] dark:text-gray-300">
          {message}
        </div>
      ) : null}

      <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => (
          <article
            key={category.id}
            className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900"
          >
            {editingId === category.id ? (
              <form
                onSubmit={(event) => handleEditSubmit(event, category.id)}
                className="space-y-4"
              >
                <div className="flex items-start gap-4">
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white text-sm font-bold text-gray-900 shadow-theme-xs dark:bg-gray-950 dark:text-white">
                    {category.imageUrl ? (
                      <Image
                        src={category.imageUrl}
                        alt={category.name}
                        fill
                        sizes="64px"
                        className="object-contain p-2"
                      />
                    ) : (
                      category.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                        Marca
                      </span>
                      <input
                        name="name"
                        defaultValue={category.name}
                        required
                        className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
                      />
                    </label>
                  </div>
                </div>

                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                    Descripcion
                  </span>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={category.description ?? ""}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Tipo
                    </span>
                    <select
                      name="categoryType"
                      defaultValue={category.categoryType}
                      className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
                    >
                      {categoryTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Orden
                    </span>
                    <input
                      name="sortOrder"
                      type="number"
                      min="0"
                      defaultValue={category.sortOrder}
                      className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
                    />
                  </label>
                  <label className="flex items-end gap-2 pb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input
                      name="isActive"
                      type="checkbox"
                      defaultChecked={category.isActive}
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    Activa
                  </label>
                  <label className="flex items-end gap-2 pb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input
                      name="showOnHome"
                      type="checkbox"
                      defaultChecked={category.showOnHome}
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    Portada
                  </label>
                  <label className="flex items-end gap-2 pb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input
                      name="showInFrontend"
                      type="checkbox"
                      defaultChecked={category.showInFrontend}
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    Frontend
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                    Cambiar imagen
                  </span>
                  <input
                    name="image"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="h-10 w-full overflow-hidden rounded-lg border border-gray-300 bg-white text-xs text-gray-500 file:mr-3 file:cursor-pointer file:border-0 file:border-r file:border-gray-200 file:bg-gray-50 file:px-3 file:py-2.5 file:text-xs file:text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400 dark:file:border-gray-800 dark:file:bg-white/[0.03] dark:file:text-gray-400"
                  />
                </label>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={editingSubmitId === category.id}
                    className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
                  >
                    {editingSubmitId === category.id
                      ? "Guardando..."
                      : "Guardar"}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-start gap-4">
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white text-sm font-bold text-gray-900 shadow-theme-xs dark:bg-gray-950 dark:text-white">
                    {category.imageUrl ? (
                      <Image
                        src={category.imageUrl}
                        alt={category.name}
                        fill
                        sizes="64px"
                        className="object-contain p-2"
                      />
                    ) : (
                      category.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {category.name}
                    </h3>
                    <span className="mt-1 inline-flex rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-950 dark:text-gray-400">
                      {category.categoryType === "tool" ? "Tool" : "Marca"}
                    </span>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                      {category.description || "Sin descripcion."}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
                  <span className="text-xs text-gray-400">
                    Orden {category.sortOrder}
                  </span>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <label className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 dark:bg-gray-950 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={category.showOnHome}
                        onChange={(event) =>
                          toggleCategoryHome(category.id, event.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                      Portada
                    </label>
                    <label className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 dark:bg-gray-950 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={category.showInFrontend}
                        onChange={(event) =>
                          toggleCategoryFrontend(
                            category.id,
                            event.target.checked
                          )
                        }
                        className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                      Frontend
                    </label>
                    <label className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 dark:bg-gray-950 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={category.isActive}
                        onChange={(event) =>
                          toggleCategory(category.id, event.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                      Activa
                    </label>
                  </div>
                </div>
                {category.categoryType === "brand" ? (
                  <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-800">
                    <div className="flex flex-wrap gap-2">
                      {category.models.map((model) => (
                        <span
                          key={model.id}
                          className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-950 dark:text-gray-300"
                        >
                          {model.name}
                          {model.year ? ` ${model.year}` : ""}
                        </span>
                      ))}
                    </div>
                    <form
                      onSubmit={(event) =>
                        handleModelSubmit(event, category.id)
                      }
                      className="mt-3 grid gap-2"
                    >
                      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_90px]">
                        <input
                          name="name"
                          placeholder="Modelo"
                          className="h-9 min-w-0 rounded-lg border border-gray-300 bg-white px-3 text-xs text-gray-800 outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
                        />
                        <input
                          name="year"
                          type="number"
                          min="2000"
                          max="2100"
                          placeholder="Año"
                          className="h-9 min-w-0 rounded-lg border border-gray-300 bg-white px-3 text-xs text-gray-800 outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
                        />
                      </div>
                      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                        <input
                          name="code"
                          placeholder="Codigo"
                          className="h-9 min-w-0 rounded-lg border border-gray-300 bg-white px-3 text-xs text-gray-800 outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
                        />
                        <input
                          name="details"
                          placeholder="Detalles"
                          className="h-9 min-w-0 rounded-lg border border-gray-300 bg-white px-3 text-xs text-gray-800 outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
                        />
                        <button
                          type="submit"
                          className="sm:col-span-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
                        >
                          Agregar
                        </button>
                      </div>
                    </form>
                  </div>
                ) : null}
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingId(category.id)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
                  >
                    Editar
                  </button>
                </div>
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
