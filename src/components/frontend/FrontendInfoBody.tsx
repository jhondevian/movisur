"use client";

import { addCartItem } from "@/lib/frontend-cart";
import type { AuthUser } from "@/lib/auth";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";

type SalePlan = {
  id: string;
  name: string;
  durationMonths: number;
  price: string;
  includedItems: string[];
};

type PaymentMethod = {
  code: string;
  name: string;
  config: Record<string, string>;
};

type SalePayload = {
  settings: {
    productName: string;
    currency: string;
    description: string | null;
    isActive: boolean;
  };
  plans: SalePlan[];
  paymentMethods: PaymentMethod[];
};

type ConfirmPaymentResponse = {
  duplicate?: boolean;
  message?: string;
};

const featureGroups = [
  {
    title: "Servicios Android",
    text: "Movisur Tool se presenta como una herramienta para tecnicos que trabajan con dispositivos Android, especialmente en tareas de diagnostico, soporte y mantenimiento.",
  },
  {
    title: "ADB y Fastboot",
    text: "Las referencias publicas mencionan funciones relacionadas con ADB, Fastboot, activacion de modo tecnico y procesos de soporte por cable USB.",
  },
  {
    title: "Archivos y utilidades",
    text: "El flujo de esta web esta pensado para publicar versiones en ZIP, mantener historial y entregar descargas desde el panel administrativo.",
  },
  {
    title: "Marcas compatibles",
    text: "Se encuentran menciones de soporte o recursos para Samsung, Xiaomi, Honor, Huawei, Motorola, Tecno e Infinix.",
  },
];

const videoTutorials = [
  { title: "Extraccion y escritura", videoId: "0zD3S9iPld4" },
  { title: "Samsung FRP 2025", videoId: "TqpQjC59b0E" },
  { title: "Enable ADB", videoId: "VofE6Jnsums" },
  { title: "VIP Edition KG", videoId: "VnjlTDm6mTY" },
];

const steps = [
  "Revisa la version disponible y sus notas de cambio.",
  "Descarga el archivo ZIP desde la web oficial de Movisur.",
  "Extrae el paquete y verifica los archivos incluidos.",
  "Usa la herramienta solo en equipos propios o con autorizacion.",
];

const faq = [
  {
    question: "Que es Movisur Tool?",
    answer:
      "Es una herramienta tecnica para soporte de dispositivos Android. En internet aparece asociada a funciones de ADB, Fastboot, servicios Samsung, archivos de utilidad y mantenimiento.",
  },
  {
    question: "La descarga sale desde esta web?",
    answer:
      "Si. El boton Descargar del frontend queda conectado con la ultima version activa que subas desde el panel admin.",
  },
  {
    question: "Por que se sube en ZIP?",
    answer:
      "El ZIP permite publicar la herramienta junto con archivos auxiliares, notas y recursos necesarios en un solo paquete.",
  },
];

function getPaymentSummary(method: PaymentMethod) {
  if (method.code === "paypal") return method.config.email || method.config.checkoutUrl;
  if (method.code === "binance") return method.config.payId || method.config.wallet;
  if (method.code === "mercadopago") return method.config.checkoutUrl || method.config.publicKey;
  if (method.code === "transferencia") return method.config.bankName || method.config.accountNumber;

  return method.config.notes;
}

export default function FrontendInfoBody() {
  const router = useRouter();
  const [sale, setSale] = useState<SalePayload | null>(null);
  const [purchaseMode, setPurchaseMode] = useState(false);
  const [directPlanId, setDirectPlanId] = useState<string | null>(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [message, setMessage] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPurchaseMode(
        new URLSearchParams(window.location.search).has("comprar")
      );
    }, 0);

    async function loadSale() {
      const response = await fetch("/api/movisur/sale", { cache: "no-store" });
      if (!response.ok) return;
      setSale((await response.json()) as SalePayload);
    }

    loadSale();

    return () => window.clearTimeout(timeout);
  }, []);

  const visiblePlans = useMemo(() => {
    if (!sale) return [];
    if (!directPlanId) return sale.plans;

    return sale.plans.filter((plan) => plan.id === directPlanId);
  }, [directPlanId, sale]);
  const comparisonItems = useMemo(() => {
    const items = visiblePlans.flatMap((plan) => plan.includedItems);
    return Array.from(new Set(items.filter(Boolean)));
  }, [visiblePlans]);

  function handleAddPlan(plan: SalePlan) {
    if (!sale) return;

    addCartItem({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      currency: sale.settings.currency,
      durationMonths: plan.durationMonths,
    });
    setMessage(`${plan.name} agregado al carrito.`);
  }

  function handleDirectBuy(plan: SalePlan) {
    setPurchaseMode(true);
    setDirectPlanId(plan.id);
    setMessage("");
    setPaymentMessage("");
  }

  async function handleConfirmPayment(method: PaymentMethod) {
    if (!sale || method.code !== "binance" || confirmingPayment) return;

    const plan = visiblePlans[0];
    if (!plan) return;
    if (!paymentProof) {
      setPaymentMessage("Sube una captura o imagen del comprobante.");
      return;
    }

    setConfirmingPayment(true);
    setPaymentMessage("");

    const meResponse = await fetch("/api/auth/me", { cache: "no-store" });
    const mePayload = meResponse.ok
      ? ((await meResponse.json()) as { user: AuthUser | null })
      : { user: null };

    if (!mePayload.user) {
      setConfirmingPayment(false);
      setPaymentMessage("Inicia sesion para confirmar el pago.");
      router.push("/signin?next=/informacion?comprar=1");
      return;
    }

    const formData = new FormData();
    formData.set("method", method.code);
    formData.set("planId", plan.id);
    formData.set("planName", plan.name);
    formData.set("price", plan.price);
    formData.set("currency", sale.settings.currency);
    formData.set("proof", paymentProof);

    const response = await fetch("/api/movisur/confirm-payment", {
      method: "POST",
      body: formData,
    });
    const payload = (await response.json().catch(() => null)) as
      | ConfirmPaymentResponse
      | null;

    setConfirmingPayment(false);

    if (payload?.duplicate) {
      setPaymentProof(null);
      setPaymentMessage(
        payload.message ??
          "Ya tienes una confirmacion enviada. Revisa tus confirmaciones enviadas."
      );
      router.push("/usuario/compras?confirmacion=pendiente");
      router.refresh();
      return;
    }

    if (!response.ok) {
      setPaymentMessage(payload?.message ?? "No se pudo confirmar el pago.");
      return;
    }

    setPaymentProof(null);
    setPaymentMessage("Pago enviado con comprobante. Te llevamos a tus compras.");
    router.push("/usuario/compras");
    router.refresh();
  }

  return (
    <main className="bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      {!purchaseMode && (
        <section className="border-b border-gray-100 bg-[linear-gradient(180deg,#f8fbff_0%,#f7f6ff_58%,#eef3ff_100%)] dark:border-gray-900 dark:bg-none dark:bg-gray-950">
          <div className="mx-auto w-full max-w-7xl px-5 py-16 text-center sm:px-6 lg:px-8">
            <h1 className="mx-auto max-w-5xl text-[38px] font-extrabold leading-[1.06] text-gray-950 dark:text-white sm:text-[58px] lg:text-[68px]">
              Todo sobre Movisur Tool
            </h1>
            <p className="mx-auto mt-6 max-w-4xl text-base leading-7 text-gray-600 dark:text-gray-400 sm:text-xl sm:leading-8">
              Una pagina clara para explicar que incluye la herramienta, como se
              publican las versiones y como descargar el paquete correcto desde
              Movisur.
            </p>

            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <a
                href="/api/movisur/download"
                className="rounded-lg bg-brand-500 px-8 py-4 text-base font-semibold text-white shadow-theme-md transition hover:bg-brand-600"
              >
                Descargar
              </a>
              <button
                type="button"
                onClick={() => {
                  setPurchaseMode(true);
                  setDirectPlanId(null);
                }}
                className="rounded-lg border border-gray-300 bg-white px-8 py-4 text-base font-semibold text-gray-900 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-white/5"
              >
                Comprar
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {purchaseMode ? (
          <div>
            <div className="mb-10 text-center">
              <h2 className="text-[34px] font-extrabold leading-tight text-gray-950 dark:text-white sm:text-[44px]">
                Planes de Movisur Tool
              </h2>
              <p className="mx-auto mt-3 max-w-3xl text-base leading-7 text-gray-600 dark:text-gray-400">
                Selecciona un plan, agrega herramientas incluidas y continua con
                el metodo de pago disponible.
              </p>
              {directPlanId && (
                <button
                  type="button"
                  onClick={() => setDirectPlanId(null)}
                  className="mt-5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                >
                  Ver todos los planes
                </button>
              )}
            </div>

            {message && (
              <div className="mb-5 rounded-lg bg-brand-50 px-4 py-3 text-sm font-medium text-brand-500 dark:bg-brand-500/10">
                {message}
              </div>
            )}

            <div className="grid gap-5 md:hidden">
              {visiblePlans.map((plan) => (
                <article
                  key={`${plan.id}-mobile`}
                  className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-950 dark:text-white">
                        {plan.name}
                      </h3>
                      <p className="mt-1 text-sm font-medium text-gray-500">
                        {plan.durationMonths} mes(es)
                      </p>
                    </div>
                    <p className="shrink-0 text-2xl font-extrabold text-gray-950 dark:text-white">
                      {sale?.settings.currency} {plan.price}
                    </p>
                  </div>

                  <div className="mt-5 grid gap-3">
                    <button
                      type="button"
                      onClick={() => handleAddPlan(plan)}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    >
                      Agregar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDirectBuy(plan)}
                      className="rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
                    >
                      Comprar
                    </button>
                  </div>

                  <div className="mt-5 border-t border-gray-200 pt-4 dark:border-gray-800">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Caracteristicas
                    </p>
                    <ul className="mt-3 grid gap-2">
                      {comparisonItems.map((item) => (
                        <li
                          key={`${plan.id}-mobile-${item}`}
                          className="flex items-center justify-between gap-3 text-sm text-gray-600 dark:text-gray-300"
                        >
                          <span>{item}</span>
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                              plan.includedItems.includes(item)
                                ? "bg-success-500 text-white"
                                : "bg-gray-100 text-gray-400 dark:bg-gray-900"
                            }`}
                          >
                            {plan.includedItems.includes(item) ? "✓" : "-"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-hidden bg-white dark:bg-white/[0.03] md:block">
              <div className="overflow-x-auto">
                <div
                  className={`grid min-w-[860px] ${
                    visiblePlans.length === 1
                      ? "grid-cols-[280px_360px] justify-center"
                      : visiblePlans.length === 2
                      ? "grid-cols-[280px_repeat(2,300px)] justify-center"
                      : visiblePlans.length === 3
                      ? "grid-cols-[280px_repeat(3,280px)] justify-center"
                      : "grid-cols-[280px_repeat(4,minmax(220px,1fr))]"
                  }`}
                >
                  <div className="border-b border-r border-gray-200 p-6 dark:border-gray-800">
                    <div className="flex flex-wrap gap-4 text-center text-xs font-medium text-gray-500">
                      {["Samsung", "LG", "Xiaomi", "Honor", "Huawei"].map(
                        (brand) => (
                          <span
                            key={brand}
                            className="flex flex-col items-center gap-2"
                          >
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-xs font-bold text-gray-900 dark:bg-gray-900 dark:text-white">
                              {brand.slice(0, 2)}
                            </span>
                            {brand}
                          </span>
                        )
                      )}
                    </div>
                    <p className="mt-6 text-sm leading-6 text-gray-700 dark:text-gray-300">
                      Planes para usar Movisur Tool con herramientas incluidas
                      segun la duracion seleccionada.
                    </p>
                  </div>

                  {visiblePlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="border-b border-r border-gray-200 p-6 last:border-r-0 dark:border-gray-800"
                    >
                      <h3 className="text-lg font-bold text-gray-950 dark:text-white">
                        {plan.name}
                      </h3>
                      <p className="mt-4 text-3xl font-extrabold text-gray-950 dark:text-white">
                        {sale?.settings.currency} {plan.price}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {plan.durationMonths} mes(es)
                      </p>
                      <p className="mt-2 min-h-10 text-sm leading-5 text-gray-500">
                        Incluye acceso a las herramientas configuradas para este
                        plan.
                      </p>
                      <div className="mt-5 grid gap-3">
                        <button
                          type="button"
                          onClick={() => handleAddPlan(plan)}
                          className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        >
                          Agregar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDirectBuy(plan)}
                          className="rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
                        >
                          Comprar
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="border-b border-r border-gray-200 px-6 py-4 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-300">
                    Caracteristicas
                  </div>
                  {visiblePlans.map((plan) => (
                    <div
                      key={`${plan.id}-limits`}
                      className="border-b border-r border-gray-200 px-6 py-4 text-center text-sm font-medium text-gray-500 last:border-r-0 dark:border-gray-800"
                    >
                      Incluido
                    </div>
                  ))}

                  {comparisonItems.map((item) => (
                    <Fragment key={item}>
                      <div
                        className="border-b border-r border-gray-200 px-6 py-5 text-sm font-medium text-gray-700 dark:border-gray-800 dark:text-gray-300"
                      >
                        {item}
                      </div>
                      {visiblePlans.map((plan) => (
                        <div
                          key={`${plan.id}-${item}`}
                          className="flex items-center justify-center border-b border-r border-gray-200 px-6 py-5 last:border-r-0 dark:border-gray-800"
                        >
                          {plan.includedItems.includes(item) ? (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success-500 text-sm font-bold text-white">
                              ✓
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </div>
                      ))}
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>

            {directPlanId && (
              <div className="mt-12">
                <h2 className="text-center text-[30px] font-extrabold leading-tight text-gray-950 dark:text-white sm:text-[38px]">
                  Metodos de pago disponibles
                </h2>
                <div
                  className={`mt-8 grid gap-4 bg-transparent md:gap-0 md:overflow-hidden md:bg-white md:dark:bg-white/[0.03] ${
                    (sale?.paymentMethods.length ?? 0) === 1
                      ? "mx-auto max-w-md"
                    : (sale?.paymentMethods.length ?? 0) === 2
                      ? "mx-auto max-w-3xl md:grid-cols-2"
                      : (sale?.paymentMethods.length ?? 0) === 3
                      ? "mx-auto max-w-5xl md:grid-cols-3"
                      : "md:grid-cols-2 xl:grid-cols-4"
                  }`}
                >
                  {sale?.paymentMethods.length ? (
                    sale.paymentMethods.map((method) => (
                      <article
                        key={method.code}
                        className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03] md:rounded-none md:border-0 md:border-b md:border-r md:p-6 md:shadow-none md:last:border-r-0"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-500 dark:bg-brand-500/10">
                            {method.name.slice(0, 2)}
                          </span>
                          <div>
                            <h3 className="text-base font-bold text-gray-950 dark:text-white">
                              {method.name}
                            </h3>
                            <p className="text-xs uppercase text-gray-400">
                              {method.code}
                            </p>
                          </div>
                        </div>
                        {getPaymentSummary(method) && (
                          <p className="mt-3 break-words text-sm leading-6 text-gray-600 dark:text-gray-400">
                            {getPaymentSummary(method)}
                          </p>
                        )}
                        {method.code === "binance" && method.config.imageUrl && (
                          <div className="relative mt-4 h-72 overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-900">
                            <Image
                              src={method.config.imageUrl}
                              alt="Binance"
                              fill
                              sizes="(max-width: 768px) 100vw, 480px"
                              className="object-contain p-3"
                            />
                          </div>
                        )}
                        {method.config.notes && (
                          <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
                            {method.config.notes}
                          </p>
                        )}
                        {method.code === "binance" && (
                          <label className="mt-5 block rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm font-medium text-gray-700 transition hover:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                            <span className="block font-semibold text-gray-950 dark:text-white">
                              Comprobante de pago
                            </span>
                            <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                              Sube una captura PNG, JPG o WebP.
                            </span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              className="mt-3 block w-full text-xs"
                              onChange={(event) => {
                                setPaymentProof(event.target.files?.[0] ?? null);
                                setPaymentMessage("");
                              }}
                            />
                            {paymentProof ? (
                              <span className="mt-2 block truncate text-xs font-semibold text-brand-500">
                                {paymentProof.name}
                              </span>
                            ) : null}
                          </label>
                        )}
                        <button
                          type="button"
                          onClick={() => handleConfirmPayment(method)}
                          disabled={
                            method.code !== "binance" ||
                            confirmingPayment ||
                            !paymentProof
                          }
                          className="mt-5 w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
                        >
                          {method.code === "binance"
                            ? confirmingPayment
                              ? "Confirmando..."
                              : "Confirmar pago"
                            : "Usar metodo"}
                        </button>
                        {method.code === "binance" && paymentMessage && (
                          <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-500 dark:bg-brand-500/10">
                            {paymentMessage}
                          </p>
                        )}
                      </article>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      Aun no hay metodos de pago activos.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {videoTutorials.map((video) => (
                <article
                  key={video.videoId}
                  className="overflow-hidden rounded-2xl bg-white shadow-theme-xs dark:bg-white/[0.03]"
                >
                  <div className="aspect-video w-full bg-gray-100 dark:bg-gray-900">
                    <iframe
                      className="h-full w-full"
                      src={`https://www.youtube.com/embed/${video.videoId}`}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                  <div className="px-5 py-4">
                    <h2 className="text-base font-bold text-gray-950 dark:text-white">
                      {video.title}
                    </h2>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {featureGroups.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-2xl bg-white p-6 shadow-theme-xs dark:bg-white/[0.03]"
                >
                  <h2 className="text-lg font-bold text-gray-950 dark:text-white">
                    {feature.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
                    {feature.text}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-14 grid gap-10 rounded-2xl bg-gray-50 p-6 dark:bg-gray-900/40 lg:grid-cols-[0.85fr_1.15fr]">
              <div>
                <h2 className="text-title-sm font-semibold text-gray-950 dark:text-white">
                  Descarga ordenada, versionada y pensada para soporte tecnico.
                </h2>
                <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-400">
                  El panel de Movisur permite publicar nuevas versiones sin
                  tocar codigo. La web siempre descarga la version activa mas
                  reciente.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {steps.map((step, index) => (
                  <div
                    key={step}
                    className="rounded-xl bg-white p-5 shadow-theme-xs dark:bg-gray-950"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-500 dark:bg-brand-500/10">
                      {index + 1}
                    </span>
                    <p className="mt-4 text-sm leading-6 text-gray-700 dark:text-gray-300">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {faq.map((item) => (
                <article
                  key={item.question}
                  className="rounded-2xl bg-white p-6 shadow-theme-xs dark:bg-white/[0.03]"
                >
                  <h2 className="text-base font-bold text-gray-950 dark:text-white">
                    {item.question}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
                    {item.answer}
                  </p>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
