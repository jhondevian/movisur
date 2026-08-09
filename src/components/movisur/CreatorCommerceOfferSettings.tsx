"use client";

import Image from "next/image";
import AccessCountdown from "@/components/frontend/AccessCountdown";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type Plan = {
  id: string;
  name: string;
  durationMonths: number;
  basePrice: string;
  currency: string;
  offerPrice: string;
  offerCurrency: string;
  offerActive: boolean;
};

type CommerceItem = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  plans: Plan[];
};

type CreatorCommerceOfferSettingsProps = {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  durationLabel: "meses" | "horas";
  saveEndpoint: string;
  accountEndpoint: string;
  items: CommerceItem[];
};

type Account = {
  id: string;
  username: string;
  password: string;
  note: string | null;
  assignedAt: string | null;
  assignedExpiresAt?: string | null;
  assignedTo: {
    name: string;
    email: string;
  } | null;
};

type ActiveAccountPanel = {
  itemId: string;
  itemName: string;
  planId: string;
  planName: string;
} | null;

function formatDuration(value: number, label: "meses" | "horas") {
  if (label === "horas") return `${value} hora${value === 1 ? "" : "s"}`;
  return `${value} mes${value === 1 ? "" : "es"}`;
}

export default function CreatorCommerceOfferSettings({
  title,
  description,
  emptyTitle,
  emptyDescription,
  durationLabel,
  saveEndpoint,
  accountEndpoint,
  items,
}: CreatorCommerceOfferSettingsProps) {
  const router = useRouter();
  const [draftItems, setDraftItems] = useState(items);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeAccounts, setActiveAccounts] = useState<ActiveAccountPanel>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountMessage, setAccountMessage] = useState("");
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({
    username: "",
    password: "",
    note: "",
  });

  useEffect(() => {
    if (!activeAccounts) return;

    let cancelled = false;
    const currentPanel = activeAccounts;

    async function loadAccounts() {
      setIsLoadingAccounts(true);
      setAccountMessage("");

      const response = await fetch(
        `${accountEndpoint}?planId=${currentPanel.planId}`
      );
      const payload = (await response.json().catch(() => null)) as {
        accounts?: Account[];
        message?: string;
      } | null;

      if (cancelled) return;

      setIsLoadingAccounts(false);

      if (!response.ok) {
        setAccountMessage(payload?.message ?? "No se pudieron cargar cuentas.");
        return;
      }

      setAccounts(payload?.accounts ?? []);
    }

    loadAccounts();

    return () => {
      cancelled = true;
    };
  }, [accountEndpoint, activeAccounts]);

  function updatePlan(
    itemId: string,
    planId: string,
    data: Partial<Plan>
  ) {
    setDraftItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              plans: item.plans.map((plan) =>
                plan.id === planId ? { ...plan, ...data } : plan
              ),
            }
          : item
      )
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSaving(true);

    const offers = draftItems.flatMap((item) =>
      item.plans.map((plan) => ({
        itemId: item.id,
        planId: plan.id,
        price: Number(plan.offerPrice || 0),
        currency: plan.offerCurrency || plan.currency,
        isActive: plan.offerActive,
      }))
    );

    const response = await fetch(saveEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offers }),
    });

    setIsSaving(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      setMessage(payload?.message ?? "No se pudo guardar.");
      return;
    }

    setMessage("Configuracion guardada.");
    router.refresh();
  }

  async function handleAccountSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeAccounts) return;

    setIsSavingAccount(true);
    setAccountMessage("");

    const response = await fetch(accountEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId: activeAccounts.itemId,
        planId: activeAccounts.planId,
        username: newAccount.username,
        password: newAccount.password,
        note: newAccount.note,
      }),
    });

    const payload = (await response.json().catch(() => null)) as {
      account?: Account;
      message?: string;
    } | null;

    setIsSavingAccount(false);

    if (!response.ok) {
      setAccountMessage(payload?.message ?? "No se pudo agregar la cuenta.");
      return;
    }

    setNewAccount({ username: "", password: "", note: "" });
    setAccountMessage("Cuenta agregada.");
    setAccounts((current) =>
      payload?.account
        ? [
            {
              id: payload.account.id,
              username: payload.account.username,
              password: payload.account.password,
              note: payload.account.note,
              assignedAt: payload.account.assignedAt,
              assignedExpiresAt: payload.account.assignedExpiresAt,
              assignedTo: null,
            },
            ...current,
          ]
        : current
    );
  }

  if (activeAccounts) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => {
                setActiveAccounts(null);
                setAccounts([]);
                setAccountMessage("");
              }}
              className="text-sm font-medium text-brand-500 hover:text-brand-600"
            >
              Volver
            </button>
            <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
              Cuentas
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {activeAccounts.itemName} - {activeAccounts.planName}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleAccountSubmit}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Agregar cuenta
          </h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Usuario
              </span>
              <input
                value={newAccount.username}
                onChange={(event) =>
                  setNewAccount((current) => ({
                    ...current,
                    username: event.target.value,
                  }))
                }
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Contrasena
              </span>
              <input
                value={newAccount.password}
                onChange={(event) =>
                  setNewAccount((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Nota
              </span>
              <input
                value={newAccount.note}
                onChange={(event) =>
                  setNewAccount((current) => ({
                    ...current,
                    note: event.target.value,
                  }))
                }
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
              />
            </label>
            <button
              type="submit"
              disabled={isSavingAccount}
              className="h-11 rounded-lg bg-brand-500 px-5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
            >
              {isSavingAccount ? "Agregando..." : "Agregar"}
            </button>
          </div>
          {accountMessage ? (
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              {accountMessage}
            </p>
          ) : null}
        </form>

        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Cuentas cargadas
            </h2>
          </div>

          {isLoadingAccounts ? (
            <p className="px-5 py-8 text-sm text-gray-500 dark:text-gray-400">
              Cargando cuentas...
            </p>
          ) : accounts.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="grid gap-5 px-5 py-5 lg:grid-cols-[1.1fr_1.1fr_1.4fr] lg:items-start"
                >
                  <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900">
                    <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Usuario
                    </p>
                    <p className="mt-2 break-all text-base font-semibold text-gray-900 dark:text-white">
                      {account.username}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900">
                    <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Contrasena
                    </p>
                    <p className="mt-2 break-all text-base font-semibold text-gray-900 dark:text-white">
                      {account.password}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900">
                    <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Estado
                    </p>
                    <span
                      className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        account.assignedTo
                          ? "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400"
                          : "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
                      }`}
                    >
                      {account.assignedTo
                        ? `Asignada a ${account.assignedTo.email}`
                        : "Disponible"}
                    </span>
                    {account.note ? (
                      <p className="mt-3 break-words text-sm text-gray-600 dark:text-gray-300">
                        {account.note}
                      </p>
                    ) : null}
                    {account.assignedTo && account.assignedExpiresAt ? (
                      <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-500 dark:bg-brand-500/10">
                        Tiempo restante:{" "}
                        <AccessCountdown expiresAt={account.assignedExpiresAt} />
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-5 py-8 text-sm text-gray-500 dark:text-gray-400">
              Aun no agregaste cuentas para este plan.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>

        <button
          type="submit"
          disabled={isSaving || draftItems.length === 0}
          className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
        >
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      {message ? (
        <div className="mb-6 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:bg-white/[0.03] dark:text-gray-300">
          {message}
        </div>
      ) : null}

      {draftItems.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {draftItems.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div className="flex flex-col gap-5 sm:flex-row">
                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-50 text-xl font-bold text-gray-900 dark:bg-gray-900 dark:text-white">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="96px"
                      className="object-contain p-2"
                    />
                  ) : (
                    item.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {item.name}
                  </h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
                    {item.description || "Disponible para creadores Movisur."}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {item.plans.length > 0 ? (
                  item.plans.map((plan) => (
                    <div
                      key={plan.id}
                      className="grid gap-3 rounded-xl bg-gray-50 p-4 dark:bg-gray-900 md:grid-cols-[1fr_130px_92px_auto] md:items-end"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {plan.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {formatDuration(plan.durationMonths, durationLabel)} -
                          base {plan.currency} {plan.basePrice}
                        </p>
                      </div>
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                          Mi precio
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={plan.offerPrice}
                          onChange={(event) =>
                            updatePlan(item.id, plan.id, {
                              offerPrice: event.target.value,
                            })
                          }
                          className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                          Moneda
                        </span>
                        <select
                          value={plan.offerCurrency}
                          onChange={(event) =>
                            updatePlan(item.id, plan.id, {
                              offerCurrency: event.target.value,
                            })
                          }
                          className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
                        >
                          <option value="USD">USD</option>
                          <option value="PEN">PEN</option>
                          <option value="BOB">BOB</option>
                        </select>
                      </label>
                      <div className="flex flex-wrap items-center gap-3 pb-1">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          <input
                            type="checkbox"
                            checked={plan.offerActive}
                            onChange={(event) =>
                              updatePlan(item.id, plan.id, {
                                offerActive: event.target.checked,
                              })
                            }
                            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                          />
                          Activo
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveAccounts({
                              itemId: item.id,
                              itemName: item.name,
                              planId: plan.id,
                              planName: plan.name,
                            })
                          }
                          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-white/[0.03]"
                        >
                          Cuentas
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Aun no tiene planes configurados.
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {emptyTitle}
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {emptyDescription}
          </p>
        </div>
      )}
    </form>
  );
}
