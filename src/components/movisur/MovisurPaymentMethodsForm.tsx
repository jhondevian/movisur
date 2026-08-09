"use client";

import type { PaymentMethodCode } from "@/generated/prisma/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type EditablePaymentMethod = {
  code: PaymentMethodCode;
  name: string;
  details: string | null;
  isEnabled: boolean;
};

type PaymentConfig = Record<string, string>;

type PaymentMethodState = Omit<EditablePaymentMethod, "details"> & {
  config: PaymentConfig;
  isOpen: boolean;
};

type MovisurPaymentMethodsFormProps = {
  methods: EditablePaymentMethod[];
  title?: string;
  description?: string;
  submitEndpoint?: string;
  imageEndpoint?: string;
  imageUploadCodes?: PaymentMethodCode[];
};

const methodFields: Record<
  PaymentMethodCode,
  { key: string; label: string; placeholder: string; type?: string }[]
> = {
  paypal: [
    { key: "email", label: "Correo PayPal", placeholder: "ventas@movisur.com" },
    { key: "clientId", label: "Client ID", placeholder: "PayPal client id" },
    {
      key: "clientSecret",
      label: "Client Secret",
      placeholder: "PayPal secret",
      type: "password",
    },
    {
      key: "checkoutUrl",
      label: "Link de checkout",
      placeholder: "https://paypal.com/checkout/...",
    },
  ],
  binance: [
    { key: "payId", label: "Binance Pay ID", placeholder: "123456789" },
    { key: "wallet", label: "Wallet", placeholder: "Direccion wallet" },
    { key: "network", label: "Red", placeholder: "USDT TRC20 / BEP20" },
    { key: "memo", label: "Memo / Tag", placeholder: "Opcional" },
  ],
  mercadopago: [
    { key: "publicKey", label: "Public Key", placeholder: "APP_USR-..." },
    {
      key: "accessToken",
      label: "Access Token",
      placeholder: "APP_USR-...",
      type: "password",
    },
    {
      key: "checkoutUrl",
      label: "Link de pago",
      placeholder: "https://mpago.la/...",
    },
    {
      key: "webhookSecret",
      label: "Webhook Secret",
      placeholder: "Clave webhook",
      type: "password",
    },
  ],
  transferencia: [
    { key: "phone", label: "Numero", placeholder: "Numero Yape o celular" },
    { key: "accountNumber", label: "Cuenta", placeholder: "Numero de cuenta opcional" },
    { key: "holderName", label: "Titular", placeholder: "Nombre del titular" },
    { key: "document", label: "Documento", placeholder: "DNI opcional" },
  ],
};

function parseConfig(details: string | null) {
  if (!details) return {};

  try {
    const parsed = JSON.parse(details) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as PaymentConfig;
    }
  } catch {
    return { notes: details };
  }

  return {};
}

function serializeConfig(config: PaymentConfig) {
  return JSON.stringify(config);
}

export default function MovisurPaymentMethodsForm({
  methods,
  title = "Metodos de pago disponibles",
  description = "Activa los metodos y deja preparados los datos para compra directa.",
  submitEndpoint = "/api/admin/movisur/payment-methods",
  imageEndpoint = "/api/admin/movisur/payment-methods/image",
  imageUploadCodes = ["binance"],
}: MovisurPaymentMethodsFormProps) {
  const router = useRouter();
  const [items, setItems] = useState<PaymentMethodState[]>(
    methods.map((method) => ({
      code: method.code,
      name: method.name,
      isEnabled: method.isEnabled,
      config: parseConfig(method.details),
      isOpen: false,
    }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImageFor, setUploadingImageFor] =
    useState<PaymentMethodCode | null>(null);
  const [message, setMessage] = useState("");

  function updateMethod(
    code: PaymentMethodCode,
    data: Partial<PaymentMethodState>
  ) {
    setItems((current) =>
      current.map((item) => (item.code === code ? { ...item, ...data } : item))
    );
  }

  function updateConfig(code: PaymentMethodCode, key: string, value: string) {
    setItems((current) =>
      current.map((item) =>
        item.code === code
          ? { ...item, config: { ...item.config, [key]: value } }
          : item
      )
    );
  }

  async function handleImageUpload(
    code: PaymentMethodCode,
    fileList: FileList | null
  ) {
    const file = fileList?.[0];
    if (!file) return;

    setMessage("");
    setUploadingImageFor(code);

    const formData = new FormData();
    formData.set("method", code);
    formData.set("file", file);

    const response = await fetch(imageEndpoint, {
      method: "POST",
      body: formData,
    });

    setUploadingImageFor(null);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      setMessage(payload?.message ?? "No se pudo subir la imagen.");
      return;
    }

    const payload = (await response.json()) as { imageUrl: string };
    updateConfig(code, "imageUrl", payload.imageUrl);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const methodsPayload = items.map((item) => ({
      code: item.code,
      isEnabled: item.isEnabled,
      details: serializeConfig(item.config),
    }));

    const response = await fetch(submitEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ methods: methodsPayload }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      setMessage(payload?.message ?? "No se pudo guardar la configuracion.");
      return;
    }

    setMessage("Metodos de pago actualizados.");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {items.map((method) => (
          <article
            key={method.code}
            className="rounded-xl border border-gray-100 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {method.name}
                </h3>
                <p className="mt-1 text-xs uppercase text-gray-400">
                  {method.code === "transferencia" && method.name === "Yape"
                    ? "yape"
                    : method.code}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={method.isEnabled}
                    onChange={(event) =>
                      updateMethod(method.code, {
                        isEnabled: event.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  Activo
                </label>

                <button
                  type="button"
                  onClick={() =>
                    updateMethod(method.code, { isOpen: !method.isOpen })
                  }
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
                >
                  Configurar
                </button>
              </div>
            </div>

            {method.isOpen && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {methodFields[method.code].map((field) => (
                  <label key={field.key} className="block">
                    <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {field.label}
                    </span>
                    <input
                      type={field.type ?? "text"}
                      value={method.config[field.key] ?? ""}
                      onChange={(event) =>
                        updateConfig(method.code, field.key, event.target.value)
                      }
                      placeholder={field.placeholder}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
                    />
                  </label>
                ))}

                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Instrucciones visibles
                  </span>
                  <textarea
                    rows={3}
                    value={method.config.notes ?? ""}
                    onChange={(event) =>
                      updateConfig(method.code, "notes", event.target.value)
                    }
                    placeholder="Texto corto que vera el usuario antes de pagar."
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"
                  />
                </label>

                {imageUploadCodes.includes(method.code) && (
                  <div className="sm:col-span-2">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {method.code === "transferencia"
                          ? "QR Yape"
                          : `Imagen ${method.name}`}
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) =>
                          handleImageUpload(method.code, event.target.files)
                        }
                        className="h-11 w-full overflow-hidden rounded-lg border border-gray-300 bg-white text-sm text-gray-500 shadow-theme-xs file:mr-5 file:cursor-pointer file:border-0 file:border-r file:border-gray-200 file:bg-gray-50 file:px-4 file:py-3 file:text-sm file:text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400 dark:file:border-gray-800 dark:file:bg-white/[0.03] dark:file:text-gray-400"
                      />
                    </label>

                    {uploadingImageFor === method.code && (
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Subiendo imagen...
                      </p>
                    )}

                    {method.config.imageUrl && (
                      <div className="relative mt-4 h-48 overflow-hidden rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950">
                        <Image
                          src={method.config.imageUrl}
                          alt="Imagen Binance"
                          fill
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          className="rounded-lg object-contain p-3"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </article>
        ))}
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
        {isSubmitting ? "Guardando..." : "Guardar configuracion"}
      </button>
    </form>
  );
}
