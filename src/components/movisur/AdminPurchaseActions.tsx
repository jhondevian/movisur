"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminPurchaseActionsProps = {
  id: string;
  isConfirmed?: boolean;
  isRejected?: boolean;
  detailHref?: string;
  confirmEndpoint?: string;
  rejectEndpoint?: string;
};

export default function AdminPurchaseActions({
  id,
  isConfirmed = false,
  isRejected = false,
  detailHref = `/admin/compras/${id}`,
  confirmEndpoint = `/api/admin/compras/${id}/confirm`,
  rejectEndpoint,
}: AdminPurchaseActionsProps) {
  const router = useRouter();
  const [submittingAction, setSubmittingAction] = useState<
    "confirm" | "reject" | ""
  >("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleConfirm() {
    setSubmittingAction("confirm");
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
      setSubmittingAction("");
    }
  }

  async function handleReject() {
    if (!rejectEndpoint) return;

    setSubmittingAction("reject");
    setErrorMessage("");

    try {
      const response = await fetch(rejectEndpoint, {
        method: "POST",
      });
      const data = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        setErrorMessage(data?.message ?? "No se pudo rechazar.");
        return;
      }

      router.refresh();
    } catch {
      setErrorMessage("No se pudo conectar con el servidor.");
    } finally {
      setSubmittingAction("");
    }
  }

  const isFinal = isConfirmed || isRejected;

  return (
    <div className="flex flex-wrap items-center gap-2 whitespace-nowrap">
      <Link
        href={detailHref}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.03]"
      >
        Detalles
      </Link>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={Boolean(submittingAction) || isFinal}
        className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isConfirmed
          ? "Confirmado"
          : isRejected
          ? "Rechazado"
          : submittingAction === "confirm"
          ? "Confirmando..."
          : "Confirmar"}
      </button>
      {rejectEndpoint && !isFinal ? (
        <button
          type="button"
          onClick={handleReject}
          disabled={Boolean(submittingAction)}
          className="rounded-lg border border-error-200 bg-white px-3 py-2 text-xs font-medium text-error-600 transition hover:bg-error-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-error-500/30 dark:bg-gray-900 dark:text-error-400 dark:hover:bg-error-500/10"
        >
          {submittingAction === "reject" ? "Rechazando..." : "Rechazar"}
        </button>
      ) : null}
      {errorMessage ? (
        <p className="basis-full text-xs text-error-500">{errorMessage}</p>
      ) : null}
    </div>
  );
}
