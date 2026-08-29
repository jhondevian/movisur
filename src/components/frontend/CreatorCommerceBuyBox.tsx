"use client";

import type { AuthUser } from "@/lib/auth";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

type PaymentMethod = {
  code: string;
  name: string;
  config: Record<string, string>;
};

type Offer = {
  id: string;
  creatorId: string;
  commerceType: "license" | "rental";
  sellerName: string;
  sellerAvatarUrl: string | null;
  planName: string;
  durationLabel: string;
  price: string;
  currency: string;
  ratingAverage: number;
  ratingCount: number;
  userRating: number;
  canRate: boolean;
  paymentMethods: PaymentMethod[];
};

type CreatorCommerceBuyBoxProps = {
  offers: Offer[];
  nextPath: string;
};

function getMethodLabel(method: PaymentMethod) {
  if (method.code === "transferencia" && method.name === "Yape") return "Yape";
  return method.name;
}

function getPaymentSummary(method: PaymentMethod) {
  if (method.code === "binance") return method.config.payId || method.config.wallet;
  if (method.code === "transferencia") {
    return method.config.phone || method.config.accountNumber;
  }

  return method.config.notes;
}

export default function CreatorCommerceBuyBox({
  offers,
  nextPath,
}: CreatorCommerceBuyBoxProps) {
  const router = useRouter();
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [offerItems, setOfferItems] = useState(offers);
  const [confirmingKey, setConfirmingKey] = useState("");
  const [ratingKey, setRatingKey] = useState("");
  const [message, setMessage] = useState("");
  const [proofs, setProofs] = useState<Record<string, File | null>>({});
  const selectedOffer = offerItems.find((offer) => offer.id === selectedOfferId);

  async function confirmPayment(offer: Offer, method: PaymentMethod) {
    if (confirmingKey) return;

    const key = `${offer.id}-${method.code}`;
    const proof = proofs[key];
    if (!proof) {
      setMessage("Sube una captura o imagen del comprobante.");
      return;
    }

    setMessage("");
    setConfirmingKey(key);

    const meResponse = await fetch("/api/auth/me", { cache: "no-store" });
    const mePayload = meResponse.ok
      ? ((await meResponse.json()) as { user: AuthUser | null })
      : { user: null };

    if (!mePayload.user) {
      setConfirmingKey("");
      setMessage("Inicia sesion para confirmar el pago.");
      router.push(`/signin?next=${encodeURIComponent(nextPath)}`);
      return;
    }

    const formData = new FormData();
    formData.set("method", method.code);
    formData.set("commerceType", offer.commerceType);
    formData.set("offerId", offer.id);
    formData.set("proof", proof);

    const response = await fetch("/api/movisur/confirm-payment", {
      method: "POST",
      body: formData,
    });

    setConfirmingKey("");

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      setMessage(payload?.message ?? "No se pudo confirmar el pago.");
      return;
    }

    setProofs((current) => ({ ...current, [key]: null }));
    setMessage("Pago enviado con comprobante. Te llevamos a tus compras.");
    router.push("/usuario/compras");
    router.refresh();
  }

  async function rateVendor(offer: Offer, rating: number) {
    if (!offer.canRate || ratingKey) return;

    setRatingKey(offer.id);
    setMessage("");

    const response = await fetch("/api/creadores/rating", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creatorId: offer.creatorId,
        rating,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          message?: string;
          userRating?: number;
          summary?: { average: number; count: number };
        }
      | null;

    setRatingKey("");

    if (!response.ok) {
      setMessage(payload?.message ?? "No se pudo calificar.");
      return;
    }

    setOfferItems((current) =>
      current.map((item) =>
        item.creatorId === offer.creatorId
          ? {
              ...item,
              userRating: payload?.userRating ?? rating,
              ratingAverage: payload?.summary?.average ?? item.ratingAverage,
              ratingCount: payload?.summary?.count ?? item.ratingCount,
            }
          : item
      )
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      {message ? (
        <p className="mx-auto mb-6 max-w-xl rounded-lg bg-brand-50 px-4 py-3 text-center text-sm font-medium text-brand-500 dark:bg-brand-500/10">
          {message}
        </p>
      ) : null}

      <div className="mx-auto max-w-5xl space-y-4">
        {offerItems.map((offer) => (
          <article
            key={offer.id}
            className="border-b border-gray-100 py-5 last:border-b-0 dark:border-gray-900"
          >
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
              <div className="flex min-w-0 items-center gap-4">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-lg font-extrabold text-gray-950 dark:bg-gray-900 dark:text-white">
                  {offer.sellerAvatarUrl ? (
                    <Image
                      src={offer.sellerAvatarUrl}
                      alt={offer.sellerName}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    offer.sellerName.slice(0, 1).toUpperCase()
                  )}
                </div>
                <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-xl font-bold text-gray-950 dark:text-white">
                      {offer.sellerName || "Creador Movisur"}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => rateVendor(offer, star)}
                            disabled={!offer.canRate || ratingKey === offer.id}
                            className={`text-lg leading-none transition ${
                              star <=
                              (offer.userRating || Math.round(offer.ratingAverage))
                                ? "text-warning-500"
                                : "text-gray-300 dark:text-gray-700"
                            } ${
                              offer.canRate
                                ? "cursor-pointer hover:text-warning-500"
                                : "cursor-default"
                            }`}
                            aria-label={`Calificar ${star} estrellas`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {offer.ratingAverage.toFixed(1)} ({offer.ratingCount})
                      </span>
                      {offer.canRate ? (
                        <span className="text-xs font-semibold text-brand-500">
                          Puedes calificar
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                      {[offer.planName, offer.durationLabel]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="mt-1 whitespace-nowrap text-3xl font-extrabold text-gray-950 dark:text-white">
                      {offer.currency} {offer.price}
                    </p>
                  </div>
                </div>
              </div>

              <div className="md:justify-self-end">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedOfferId((current) =>
                      current === offer.id ? null : offer.id
                    )
                  }
                  className="w-full rounded-lg bg-brand-500 px-8 py-4 text-base font-semibold text-white shadow-theme-md transition hover:bg-brand-600 md:w-auto"
                >
                  Comprar
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {selectedOffer ? (
        <div className="mt-10">
          <h3 className="text-center text-2xl font-extrabold text-gray-950 dark:text-white">
            Metodos de pago
          </h3>

          {selectedOffer.paymentMethods.length > 0 ? (
            <div
              className={`mt-7 grid gap-6 ${
                selectedOffer.paymentMethods.length === 1
                  ? "mx-auto max-w-md"
                  : "md:grid-cols-2"
              }`}
            >
              {selectedOffer.paymentMethods.map((method) => (
                <article
                  key={`${selectedOffer.id}-${method.code}`}
                  className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
                >
                  {(() => {
                    const proofKey = `${selectedOffer.id}-${method.code}`;
                    const proof = proofs[proofKey];

                    return (
                      <>
                  <h4 className="text-lg font-bold text-gray-950 dark:text-white">
                    {getMethodLabel(method)}
                  </h4>
                  {getPaymentSummary(method) ? (
                    <p className="mt-3 break-words text-sm leading-6 text-gray-600 dark:text-gray-400">
                      {getPaymentSummary(method)}
                    </p>
                  ) : null}
                  {method.config.imageUrl ? (
                    <div className="relative mt-4 h-72 overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-900">
                      <Image
                        src={method.config.imageUrl}
                        alt={getMethodLabel(method)}
                        fill
                        sizes="(max-width: 768px) 100vw, 420px"
                        className="object-contain p-3"
                      />
                    </div>
                  ) : null}
                  {method.config.notes ? (
                    <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
                      {method.config.notes}
                    </p>
                  ) : null}
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
                        setProofs((current) => ({
                          ...current,
                          [proofKey]: event.target.files?.[0] ?? null,
                        }));
                        setMessage("");
                      }}
                    />
                    {proof ? (
                      <span className="mt-2 block truncate text-xs font-semibold text-brand-500">
                        {proof.name}
                      </span>
                    ) : null}
                  </label>
                  <button
                    type="button"
                    onClick={() => confirmPayment(selectedOffer, method)}
                    disabled={confirmingKey === proofKey || !proof}
                    className="mt-5 w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
                  >
                    {confirmingKey === proofKey
                      ? "Confirmando..."
                      : "Confirmar pago"}
                  </button>
                      </>
                    );
                  })()}
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
              Este vendedor aun no configuro metodos de pago.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
