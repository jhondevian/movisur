"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Plan = {
  id?: string;
  name: string;
  durationMonths: number;
  price: string;
  currency: string;
  isActive: boolean;
  sortOrder: number;
};

type CommerceItem = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  showInFrontend?: boolean;
  sortOrder: number;
  plans: Plan[];
};

type CreatorCommerceItemsFormProps = {
  title: string;
  description: string;
  nameLabel: string;
  namePlaceholder: string;
  endpoint: string;
  emptyText: string;
  items: CommerceItem[];
  durationLabel?: string;
  defaultPlanTemplates?: Array<{
    name: string;
    durationMonths: number;
  }>;
};

const fallbackDefaultPlans = [
  { name: "1 mes", durationMonths: 1 },
  { name: "3 meses", durationMonths: 3 },
  { name: "1 ano", durationMonths: 12 },
];

function createPlan(name = "1 mes", durationMonths = 1): Plan {
  return {
    name,
    durationMonths,
    price: "0",
    currency: "USD",
    isActive: true,
    sortOrder: 0,
  };
}

function buildDefaultPlans(
  templates: CreatorCommerceItemsFormProps["defaultPlanTemplates"]
) {
  return (templates?.length ? templates : fallbackDefaultPlans).map((plan) =>
    createPlan(plan.name, plan.durationMonths)
  );
}

export default function CreatorCommerceItemsForm({
  title,
  description,
  nameLabel,
  namePlaceholder,
  endpoint,
  emptyText,
  items,
  durationLabel = "Meses",
  defaultPlanTemplates,
}: CreatorCommerceItemsFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<CommerceItem | null>(null);
  const [newPlans, setNewPlans] = useState<Plan[]>(
    buildDefaultPlans(defaultPlanTemplates)
  );

  function setPlan(
    plans: Plan[],
    setter: (plans: Plan[]) => void,
    index: number,
    data: Partial<Plan>
  ) {
    setter(
      plans.map((plan, planIndex) =>
        planIndex === index ? { ...plan, ...data } : plan
      )
    );
  }

  function appendPlan(plans: Plan[], setter: (plans: Plan[]) => void) {
    setter([
      ...plans,
      createPlan(durationLabel === "Horas" ? "Nueva renta" : "Nuevo plan"),
    ]);
  }

  function removePlan(
    plans: Plan[],
    setter: (plans: Plan[]) => void,
    index: number
  ) {
    setter(plans.filter((_, planIndex) => planIndex !== index));
  }

  function appendPlans(formData: FormData, plans: Plan[]) {
    formData.set(
      "plans",
      JSON.stringify(
        plans.map((plan, index) => ({
          id: plan.id,
          name: plan.name,
          durationMonths: plan.durationMonths,
          price: Number(plan.price),
          currency: plan.currency,
          isActive: plan.isActive,
          sortOrder: index,
        }))
      )
    );
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    appendPlans(formData, newPlans);

    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      setMessage(payload?.message ?? "No se pudo crear.");
      return;
    }

    form.reset();
    setNewPlans(buildDefaultPlans(defaultPlanTemplates));
    setMessage("Guardado correctamente.");
    router.refresh();
  }

  async function handleEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingItem) return;

    setMessage("");
    const formData = new FormData(event.currentTarget);
    appendPlans(formData, editingItem.plans);

    const response = await fetch(`${endpoint}/${editingItem.id}`, {
      method: "PATCH",
      body: formData,
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      setMessage(payload?.message ?? "No se pudo actualizar.");
      return;
    }

    setEditingId(null);
    setEditingItem(null);
    setMessage("Actualizado correctamente.");
    router.refresh();
  }

  function startEdit(item: CommerceItem) {
    setEditingId(item.id);
    setEditingItem({
      ...item,
      plans: item.plans.length
        ? item.plans
        : buildDefaultPlans(defaultPlanTemplates),
    });
  }

  function renderPlans(plans: Plan[], setter: (plans: Plan[]) => void) {
    return (
      <div className="space-y-3">
        {plans.map((plan, index) => (
          <div
            key={`${plan.name}-${index}`}
            className="grid gap-3 md:grid-cols-[1fr_110px_120px_100px_auto] md:items-end"
          >
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Plan
              </span>
              <input
                value={plan.name}
                onChange={(event) =>
                  setPlan(plans, setter, index, { name: event.target.value })
                }
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                {durationLabel}
              </span>
              <input
                type="number"
                min="1"
                value={plan.durationMonths}
                onChange={(event) =>
                  setPlan(plans, setter, index, {
                    durationMonths: Number(event.target.value),
                  })
                }
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Precio
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={plan.price}
                onChange={(event) =>
                  setPlan(plans, setter, index, { price: event.target.value })
                }
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Moneda
              </span>
              <select
                value={plan.currency}
                onChange={(event) =>
                  setPlan(plans, setter, index, { currency: event.target.value })
                }
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
              >
                <option value="USD">USD</option>
                <option value="PEN">PEN</option>
                <option value="BOB">BOB</option>
              </select>
            </label>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={plan.isActive}
                  onChange={(event) =>
                    setPlan(plans, setter, index, {
                      isActive: event.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                Activo
              </label>
              <button
                type="button"
                onClick={() => removePlan(plans, setter, index)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
              >
                Quitar
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => appendPlan(plans, setter)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
        >
          + Agregar plan
        </button>
      </div>
    );
  }

  return (
    <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>

      <form onSubmit={handleCreate} className="mt-6 space-y-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {nameLabel}
            </span>
            <input
              name="name"
              required
              placeholder={namePlaceholder}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
            />
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
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Descripcion
          </span>
          <textarea
            name="description"
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
          />
        </label>

        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
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
          <label className="flex items-center gap-2 pb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              name="isActive"
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            Activo
          </label>
          {durationLabel === "Horas" ? (
            <label className="flex items-center gap-2 pb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              <input
                name="showInFrontend"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              Frontend
            </label>
          ) : null}
        </div>

        {renderPlans(newPlans, setNewPlans)}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
        >
          {isSubmitting ? "Guardando..." : "Crear"}
        </button>
      </form>

      {message ? (
        <div className="mt-5 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:bg-white/[0.03] dark:text-gray-300">
          {message}
        </div>
      ) : null}

      <div className="mt-7 grid gap-4 xl:grid-cols-2">
        {items.length ? (
          items.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900"
            >
              {editingId === item.id && editingItem ? (
                <form onSubmit={handleEdit} className="space-y-4">
                  <div className="flex items-start gap-4">
                    <PreviewImage imageUrl={item.imageUrl} name={item.name} />
                    <div className="grid flex-1 gap-3 md:grid-cols-2">
                      <input
                        name="name"
                        defaultValue={item.name}
                        required
                        className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
                      />
                      <input
                        name="sortOrder"
                        type="number"
                        min="0"
                        defaultValue={item.sortOrder}
                        className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
                      />
                    </div>
                  </div>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={item.description ?? ""}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
                  />
                  <input
                    name="image"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="h-10 w-full overflow-hidden rounded-lg border border-gray-300 bg-white text-xs text-gray-500 file:mr-3 file:cursor-pointer file:border-0 file:border-r file:border-gray-200 file:bg-gray-50 file:px-3 file:py-2.5 file:text-xs file:text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400 dark:file:border-gray-800 dark:file:bg-white/[0.03] dark:file:text-gray-400"
                  />
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <input
                        name="isActive"
                        type="checkbox"
                        defaultChecked={item.isActive}
                        className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                      Activo
                    </label>
                    {durationLabel === "Horas" ? (
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <input
                          name="showInFrontend"
                          type="checkbox"
                          defaultChecked={Boolean(item.showInFrontend)}
                          className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                        />
                        Frontend
                      </label>
                    ) : null}
                  </div>
                  {renderPlans(editingItem.plans, (plans) =>
                    setEditingItem({ ...editingItem, plans })
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setEditingItem(null);
                      }}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-brand-600"
                    >
                      Guardar
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-start gap-4">
                    <PreviewImage imageUrl={item.imageUrl} name={item.name} />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {item.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                        {item.description || "Sin descripcion."}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.plans.map((plan) => (
                      <span
                        key={plan.id || `${item.id}-${plan.name}`}
                        className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-600 ring-1 ring-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:ring-gray-800"
                      >
                        {plan.name} - {plan.currency} {plan.price}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {item.isActive ? "Activo" : "Inactivo"}
                      {item.showInFrontend ? " - Frontend" : ""} - Orden{" "}
                      {item.sortOrder}
                    </span>
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
                    >
                      Editar
                    </button>
                  </div>
                </>
              )}
            </article>
          ))
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">{emptyText}</p>
        )}
      </div>
    </section>
  );
}

function PreviewImage({
  imageUrl,
  name,
}: {
  imageUrl: string | null;
  name: string;
}) {
  return (
    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white text-sm font-bold text-gray-900 shadow-theme-xs dark:bg-gray-950 dark:text-white">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes="64px"
          className="object-contain p-2"
        />
      ) : (
        name.slice(0, 2).toUpperCase()
      )}
    </div>
  );
}
