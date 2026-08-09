"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminPurchaseActionsProps = {
  id: string;
  isConfirmed?: boolean;
  detailHref?: string;
  confirmEndpoint?: string;
};

export default function AdminPurchaseActions({
  id,
  isConfirmed = false,
  detailHref = `/admin/compras/${id}`,
  confirmEndpoint = `/api/admin/compras/${id}/confirm`,
}: AdminPurchaseActionsProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleConfirm() {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(confirmEndpoint, {
        method: "POST",
      });
      const data = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        setErrorMessage(data?.message ?? "No se pudo confirmar.");
        return;
      }

      router.refresh();
    } catch {
      setErrorMessage("No se pudo conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <Link
        href={detailHref}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.03]"
      >
        Detalles
      </Link>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={isSubmitting || isConfirmed}
        className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isConfirmed
          ? "Confirmado"
          : isSubmitting
          ? "Confirmando..."
          : "Confirmar"}
      </button>
      {errorMessage ? (
        <p className="basis-full text-xs text-error-500">{errorMessage}</p>
      ) : null}
    </div>
  );
}
