"use client";

import type { MovisurPaymentMethod } from "@/generated/prisma/client";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type SaleSettings = {
  productName: string;
  currency: string;
  description: string | null;
  isActive: boolean;
};

type SalePlan = {
  name: string;
  durationMonths: number;
  price: string;
  isActive: boolean;
  includedItems: string[];
};

type MovisurSaleFormProps = {
  settings: SaleSettings;
  paymentMethods: MovisurPaymentMethod[];
  plans: SalePlan[];
};

const includedSuggestions = [
  "Streaming",
  "Unlock Tool",
  "Chimera",
  "Soporte remoto",
  "Archivos VIP",
  "Actualizaciones",
];

function createPlan(): SalePlan {
  return {
    name: "Nuevo plan",
    durationMonths: 1,
    price: "0",
    isActive: true,
    includedItems: ["Streaming"],
  };
}

export default function MovisurSaleForm({
  settings,
  paymentMethods,
  plans,
}: MovisurSaleFormProps) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(settings.isActive);
  const [salePlans, setSalePlans] = useState<SalePlan[]>(
    plans.length ? plans : [createPlan()]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const enabledMethods = paymentMethods.filter((method) => method.isEnabled);

  function updatePlan(index: number, data: Partial<SalePlan>) {
    setSalePlans((current) =>
      current.map((plan, planIndex) =>
        planIndex === index ? { ...plan, ...data } : plan
      )
    );
  }

  function addIncludedItem(index: number, item = "") {
    setSalePlans((current) =>
      current.map((plan, planIndex) =>
        planIndex === index
          ? { ...plan, includedItems: [...plan.includedItems, item] }
          : plan
      )
    );
  }

  function updateIncludedItem(planIndex: number, itemIndex: number, value: string) {
    setSalePlans((current) =>
      current.map((plan, currentPlanIndex) =>
        currentPlanIndex === planIndex
          ? {
              ...plan,
              includedItems: plan.includedItems.map((item, currentItemIndex) =>
                currentItemIndex === itemIndex ? value : item
              ),
            }
          : plan
      )
    );
  }

  function removeIncludedItem(planIndex: number, itemIndex: number) {
    setSalePlans((current) =>
      current.map((plan, currentPlanIndex) =>
        currentPlanIndex === planIndex
          ? {
              ...plan,
              includedItems: plan.includedItems.filter(
                (_, currentItemIndex) => currentItemIndex !== itemIndex
              ),
            }
          : plan
      )
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    formData.set("isActive", isActive ? "true" : "false");
    formData.set(
      "plans",
      JSON.stringify(
        salePlans.map((plan) => ({
          name: plan.name,
          durationMonths: plan.durationMonths,
          price: Number(plan.price),
          isActive: plan.isActive,
          includedItems: plan.includedItems,
        }))
      )
    );

    const response = await fetch("/api/admin/movisur/sale", {
      method: "POST",
      body: formData,
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      setMessage(payload?.message ?? "No se pudo guardar la venta.");
      return;
    }

    setMessage("Planes de venta actualizados correctamente.");
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Planes de venta
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configura duracion, precio y adicionales incluidos por cada plan.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Producto
            </span>
            <input
              name="productName"
              defaultValue={settings.productName}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Moneda
            </span>
            <select
              name="currency"
              defaultValue={settings.currency}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              <option value="USD">USD</option>
              <option value="PEN">PEN</option>
              <option value="BOB">BOB</option>
            </select>
          </label>
        </div>

        <label className="mt-5 block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Descripcion de venta
          </span>
          <textarea
            name="description"
            rows={3}
            defaultValue={settings.description ?? ""}
            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
        </label>

        <div className="mt-6 space-y-5">
          {salePlans.map((plan, planIndex) => (
            <article
              key={`${plan.name}-${planIndex}`}
              className="rounded-2xl border border-gray-100 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="grid gap-4 lg:grid-cols-[1fr_150px_160px_auto] lg:items-end">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nombre del plan
                  </span>
                  <input
                    value={plan.name}
                    onChange={(event) =>
                      updatePlan(planIndex, { name: event.target.value })
                    }
                    placeholder="1 mes"
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Meses
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={plan.durationMonths}
                    onChange={(event) =>
                      updatePlan(planIndex, {
                        durationMonths: Number(event.target.value),
                      })
                    }
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Precio
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={plan.price}
                    onChange={(event) =>
                      updatePlan(planIndex, { price: event.target.value })
                    }
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
                  />
                </label>

                <label className="flex items-center gap-2 pb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={plan.isActive}
                    onChange={(event) =>
                      updatePlan(planIndex, { isActive: event.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  Activo
                </label>
              </div>

              <div className="mt-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Incluido en este plan
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {includedSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => addIncludedItem(planIndex, suggestion)}
                        className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-600 ring-1 ring-gray-200 transition hover:text-brand-500 dark:bg-gray-950 dark:text-gray-300 dark:ring-gray-800"
                      >
                        + {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {plan.includedItems.map((item, itemIndex) => (
                    <div key={`${planIndex}-${itemIndex}`} className="flex gap-2">
                      <input
                        value={item}
                        onChange={(event) =>
                          updateIncludedItem(
                            planIndex,
                            itemIndex,
                            event.target.value
                          )
                        }
                        placeholder="Streaming, Unlock Tool, Chimera..."
                        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
                      />
                      <button
                        type="button"
                        onClick={() => removeIncludedItem(planIndex, itemIndex)}
                        className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addIncludedItem(planIndex)}
                  className="mt-3 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
                >
                  + Agregar adicional
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <span className="text-sm font-medium text-gray-800 dark:text-white/90">
              Venta activa
            </span>
          </label>

          <button
            type="button"
            onClick={() => setSalePlans((current) => [...current, createPlan()])}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            + Agregar plan
          </button>
        </div>

        {message && (
          <div className="mt-5 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:bg-white/[0.03] dark:text-gray-300">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-7 rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
        >
          {isSubmitting ? "Guardando..." : "Guardar planes"}
        </button>
      </form>

      <aside className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-sm font-semibold uppercase text-brand-500">
          Resumen de venta
        </p>
        <h3 className="mt-3 text-xl font-bold text-gray-900 dark:text-white">
          {salePlans.filter((plan) => plan.isActive).length} planes activos
        </h3>
        <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
          Cada plan puede incluir herramientas adicionales sin precio extra.
        </p>

        <div className="mt-5 space-y-3">
          {salePlans.map((plan) => (
            <div
              key={`${plan.name}-summary`}
              className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              <div className="flex items-center justify-between gap-3 font-medium">
                <span>{plan.name}</span>
                <span>
                  {settings.currency} {plan.price}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {plan.includedItems.filter(Boolean).length} incluidos
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-gray-100 pt-5 dark:border-gray-800">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Metodos activos
          </p>
          <div className="mt-3 space-y-2">
            {enabledMethods.length ? (
              enabledMethods.map((method) => (
                <div
                  key={method.id}
                  className="rounded-lg bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 dark:bg-gray-900 dark:text-gray-300"
                >
                  {method.name}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Aun no hay metodos activos.
              </p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
