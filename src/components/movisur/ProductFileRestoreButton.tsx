"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ProductFileRestoreButtonProps = {
  productFileId: string;
};

export default function ProductFileRestoreButton({
  productFileId,
}: ProductFileRestoreButtonProps) {
  const router = useRouter();
  const [isRestoring, setIsRestoring] = useState(false);
  const [message, setMessage] = useState("");

  const handleRestore = async () => {
    if (isRestoring) return;

    setIsRestoring(true);
    setMessage("");

    const response = await fetch(
      `/api/admin/movisur/product-files/${productFileId}/restore`,
      {
        method: "PATCH",
      }
    );
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setMessage(payload?.message ?? "No se pudo recuperar el archivo.");
      setIsRestoring(false);
      return;
    }

    router.refresh();
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleRestore}
        disabled={isRestoring}
        className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isRestoring ? "Recuperando..." : "Recuperar"}
      </button>
      {message ? (
        <p className="mt-2 max-w-56 text-xs font-medium text-error-600 dark:text-error-400">
          {message}
        </p>
      ) : null}
    </div>
  );
}
